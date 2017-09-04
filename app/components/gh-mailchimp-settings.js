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
import {task, timeout} from 'ember-concurrency';

const {testing} = Ember;

const SYNC_POLL_MS = testing ? 100 : 5000;

export default Component.extend(ShortcutsMixin, {
    ajax: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),

    // Public attributes
    feature: null,
    mailchimp: null,
    settings: null,

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
        let url = this.get('ghostPaths.url').api('mailchimp', 'lists');
        let data = {apiKey: this.get('mailchimp.apiKey')};
        let result;

        // clear available lists
        this.set('availableLists', []);

        // don't fetch mailing lists, when no API key is entered
        if (!this.get('mailchimp.apiKey')) {
            return false;
        }

        yield this.get('mailchimp').validate({property: 'apiKey'});

        try {
            result = yield this.get('ajax').request(url, {data});
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

            this._triggerValidations();
        }

        // ensure we return a truthy value so the task button has a success state
        return true;
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

        yield this._triggerValidations();

        // Don't save when we have errors and properties are not validated
        if (mailchimp.get('errors.isActive') || mailchimp.get('errors.apiKey') || mailchimp.get('errors.activeList')) {
            return;
        }

        try {
            settings.set('mailchimp', mailchimp);

            let saveResult = yield settings.save();

            if (immediateSync) {
                yield this.get('pollForSync').perform();
            }

            return saveResult;
        } catch (error) {
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
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

        updateIsActive(value) {
            if (this.get('mailchimp.errors.isActive')) {
                this.get('mailchimp.errors.isActive').clear();
            }

            this.set('mailchimp.isActive', value);
            this._triggerValidations();
        },

        updateApiKey(value) {
            value = value ? value.toString().trim() : '';

            if (this.get('mailchimp.errors.apiKey')) {
                this.get('mailchimp.errors.apiKey').clear();
            }

            if (this.get('mailchimp.errors.isActive')) {
                this.get('mailchimp.errors.isActive').clear();
            }

            this.set('mailchimp.apiKey', value);
            this._triggerValidations();
        },

        fetchLists() {
            if (this.get('mailchimp.apiKey')) {
                this.get('fetchLists').perform();
            } else {
                this.set('availableLists', []);
            }
        },

        setList(list) {
            if (this.get('mailchimp.errors.activeList')) {
                this.get('mailchimp.errors.activeList').clear();
            }

            this.set('mailchimp.activeList.id', list.id);
            this.set('mailchimp.activeList.name', list.name);
            this._triggerValidations();
        },

        toggleDetails(property) {
            this.toggleProperty(property);
        }
    },

    // Internal functions
    _triggerValidations() {
        let isActive = this.get('mailchimp.isActive');
        let apiKey = this.get('mailchimp.apiKey');
        let noActiveList = this.get('noActiveList');
        let noAvailableLists = this.get('noAvailableLists');

        this.get('mailchimp.hasValidated').clear();

        if (isActive && !apiKey) {
            // CASE: API key is empty but MailChimp is enabled
            this.get('mailchimp.errors').add(
                'isActive',
                'You need to enter an API key before enabling it'
            );
            this.get('mailchimp.hasValidated').pushObject('isActive');
        } else if (apiKey && this.get('mailchimp.errors.apiKey')) {
            // CASE: API key was entered but we received an error message from the server
            // because the key is not valid. We don't want to overwrite this error
            this.get('mailchimp.hasValidated').pushObject('apiKey');
        } else if (!apiKey && !isActive && !noActiveList) {
            // CASE: when API key is empty and the app is disabled, we want to reset the saved list
            this.set('mailchimp.activeList.id', '');
            this.set('mailchimp.activeList.name', '');
        } else if (isActive && (apiKey && !this.get('mailchimp.errors.apiKey')) && noActiveList && !noAvailableLists) {
            let firstList = this.get('availableLists').objectAt(0);

            // CASE: App is enabled and a valid API key is entered but no list is selected
            // set first returned value as default
            this.set('mailchimp.activeList.id', firstList.id);
            this.set('mailchimp.activeList.name', firstList.name);

            this.get('mailchimp.hasValidated').pushObject('activeList');
        } else {
            // run the validation for API key
            this.get('mailchimp').validate({property: 'apiKey'});
        }
    }
});
