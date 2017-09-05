import Component from '@ember/component';
import Ember from 'ember';
import ShortcutsMixin from 'ghost-admin/mixins/shortcuts';
import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import moment from 'moment';
import {computed} from '@ember/object';
import {empty, or, readOnly} from '@ember/object/computed';
import {htmlSafe} from '@ember/string';
import {inject as injectService} from '@ember/service';
import {pluralize} from 'ember-inflector';
import {reject} from 'rsvp';
import {task, timeout} from 'ember-concurrency';

const {testing} = Ember;

const SYNC_POLL_MS = testing ? 50 : 5000;

export default Component.extend(ShortcutsMixin, {
    notifications: injectService(),
    settings: injectService(),
    feature: injectService(),

    // Public attributes
    tagName: '',
    mailchimp: null,

    // Internal attributes
    availableLists: null,
    shortcuts: {},

    // Computed properties
    isFetchingLists: readOnly('fetchLists.isRunning'),
    lastSyncAt: readOnly('settings.scheduling.subscribers.lastSyncAt'),
    listSelectDisabled: or('noAvailableLists', 'fetchLists.isRunning'),
    nextSyncAt: readOnly('settings.scheduling.subscribers.nextSyncAt'),
    noActiveList: empty('mailchimp.activeList.id'),
    noAvailableLists: empty('availableLists'),

    selectedList: computed('mailchimp.activeList.id', 'availableLists.[]', function () {
        let selectedId = this.get('mailchimp.activeList.id');
        let availableLists = this.get('availableLists');

        return availableLists.findBy('id', selectedId);
    }),

    // if the API key is changed the list ID will also have changed so this is
    // sufficient for always hiding the sync details when settings are not saved
    showSyncDetails: computed('mailchimp.activeList.id', 'settings.mailchimp.activeList.id', function () {
        return this.get('mailchimp.activeList.id') === this.get('settings.mailchimp.activeList.id');
    }),

    nextSyncInHours: computed('nextSyncAt', function () {
        let nextSyncAt = moment(this.get('nextSyncAt'));
        let hours = nextSyncAt.diff(moment()) / 1000 / 60 / 60;

        return hours;
    }),

    timeUntilNextSync: computed('nextSyncInHours', function () {
        let hours = this.get('nextSyncInHours');
        let word = 'hour';

        // display minutes if next sync in < 1 hr
        if (hours < 1) {
            let minutes = Math.round(hours * 60);
            word = 'minute';

            if (minutes === 0) {
                minutes = 1;
            }

            hours = minutes;
        }

        if (hours !== 1) {
            word = pluralize(word);
        }

        // display hours
        return `${Math.round(hours)} ${word}`;
    }),

    timeSinceLastSync: computed('lastSyncAt', function () {
        let lastSyncAt = moment(this.get('lastSyncAt'));
        let now = moment();
        let timeAgo = lastSyncAt.from(now);

        // highlight time ago if it was less than five minutes ago
        if (moment().diff(lastSyncAt) / 1000 / 60 <= 5) {
            return htmlSafe(`<strong>${timeAgo}</strong>`);
        }

        return timeAgo;
    }),

    // Hooks
    init() {
        this._super(...arguments);

        let shortcuts = this.get('shortcuts');

        shortcuts[`${ctrlOrCmd}+s`] = {action: 'save'};
    },

    didInsertElement() {
        this._super(...arguments);
        this.registerShortcuts();

        // start fetching lists asynchronously - UI will disable the select
        // and show a spinner until it's finished
        this.get('fetchLists').perform();
    },

    willDestroyElement() {
        this.removeShortcuts();
        this._super(...arguments);
    },

    // Tasks
    fetchLists: task(function* () {
        let result;

        // clear available lists
        this.set('availableLists', []);

        // don't fetch mailing lists, when no API key is entered
        if (!this.get('mailchimp.apiKey')) {
            return false;
        }

        yield this.get('mailchimp').validate({property: 'apiKey'});

        try {
            result = yield this.get('mailchimp').fetchLists();
        } catch (error) {
            if (error && error.errors && error.errors[0] && error.errors[0].errorType === 'ValidationError') {
                this.get('mailchimp.errors').add(
                    'apiKey',
                    'The MailChimp API key is invalid.'
                );
                this.get('mailchimp.hasValidated').pushObject('apiKey');
                return false;
            } else if (error) {
                this.get('notifications').showAPIError(error);
                this.get('mailchimp.hasValidated').pushObject('apiKey');
                throw error;
            }
        }

        if (result && result.lists) {
            result.lists.forEach((list) => this.get('availableLists').pushObject(list));
        }

        // reset the active list if it doesn't exist in the available lists
        if (!this.get('availableLists').findBy('id', this.get('mailchimp.activeList.id'))) {
            if (result.lists.length) {
                this.set('mailchimp.activeList.id', result.lists[0].id);
                this.set('mailchimp.activeList.name', result.lists[0].name);
            } else {
                this.set('mailchimp.activeList.id', null);
                this.set('mailchimp.activeList.name', null);
            }

            // no need to revalidate the apiKeyIsValid
            this.get('mailchimp').validate({property: 'activeList'});
        }
    }).drop(),

    save: task(function* () {
        let settings = this.get('settings');
        let mailchimp = this.get('mailchimp');
        let immediateSync = false;

        // if just activated there's an immediate background sync
        if (mailchimp.get('isActive') && !settings.get('mailchimp.isActive')) {
            immediateSync = true;
        }

        // if the active list changes there's an immediate bacground sync
        if (mailchimp.get('isActive') && mailchimp.get('activeList.id') !== settings.get('mailchimp.activeList.id')) {
            immediateSync = true;
        }

        // necessary to return a rejection with `false` so that the task button
        // will show a retru button
        yield mailchimp.validate().catch(() => {
            return reject(false);
        });

        try {
            settings.set('mailchimp', mailchimp);

            let saveResult = yield settings.save();

            if (immediateSync) {
                yield this.get('pollForSync').perform();
            }

            return saveResult;
        } catch (error) {
            // rollback settings to avoid incorrect saves elsewhere
            this.get('settings').rollbackAttributes();

            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            } else {
                return reject(false);
            }
        }
    }).drop(),

    pollForSync: task(function* () {
        let settings = this.get('settings');
        let nextSyncAt = this.get('nextSyncAt');

        // keep reloading settings until we have a new `nextSyncAt` value
        while (this.get('nextSyncAt') === nextSyncAt) {
            yield timeout(SYNC_POLL_MS);
            yield settings.reload();
        }

        this._immedateSync = false;
        return true;
    }).drop(),

    actions: {
        save() {
            this.get('save').perform();
        },

        updateIsActive(isActive) {
            if (isActive) {
                return this.get('mailchimp').validate().then(() => {
                    this.set('mailchimp.isActive', true);
                }).catch(() => {
                    this.set('mailchimp.isActive', false);
                    // TODO: this is required due to a bug in ember-one-way-controls
                    // https://github.com/DockYard/ember-one-way-controls/issues/143
                    document.querySelector('#isActive').checked = false;
                });
            } else {
                return this.set('mailchimp.isActive', false);
            }
        },

        updateApiKey(value) {
            value = value ? value.toString().trim() : '';

            this.set('mailchimp.apiKey', value);
            return this.get('mailchimp').validate({property: 'apiKey'});
        },

        fetchLists() {
            if (this.get('mailchimp.apiKey')) {
                return this.get('fetchLists').perform();
            } else {
                return this.set('availableLists', []);
            }
        },

        setList(list) {
            this.set('mailchimp.activeList.id', list.id);
            this.set('mailchimp.activeList.name', list.name);

            return this.get('mailchimp').validate({property: 'activeList'});
        }
    }
});
