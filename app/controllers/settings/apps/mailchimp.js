import Controller from '@ember/controller';
import Ember from 'ember';
import {computed} from '@ember/object';
import {empty, or, readOnly} from '@ember/object/computed';
import {inject as injectService} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

const {testing} = Ember;

const SYNC_POLL_MS = testing ? 100 : 5000;

export default Controller.extend({
    ajax: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),
    settings: injectService(),
    feature: injectService(),

    availableLists: null,
    model: null,
    showErrorDetails: false,

    isFetchingLists: readOnly('fetchLists.isRunning'),
    lastSyncAt: readOnly('settings.scheduling.subscribers.lastSyncAt'),
    listSelectDisabled: or('noAvailableLists', 'fetchLists.isRunning'),
    nextSyncAt: readOnly('settings.scheduling.subscribers.nextSyncAt'),
    noActiveList: empty('model.activeList.id'),
    noAvailableLists: empty('availableLists'),

    selectedList: computed('model.activeList.id', 'availableLists.[]', function () {
        let selectedId = this.get('model.activeList.id');
        let availableLists = this.get('availableLists');

        return availableLists.findBy('id', selectedId);
    }),

    fetchLists: task(function* () {
        let url = this.get('ghostPaths.url').api('mailchimp', 'lists');
        let data = {apiKey: this.get('model.apiKey')};
        let result;

        // clear available lists
        this.set('availableLists', []);

        // don't fetch mailing lists, when no API key is entered
        if (!this.get('model.apiKey')) {
            return false;
        }

        yield this.get('model').validate({property: 'apiKey'});

        try {
            result = yield this.get('ajax').request(url, {data});
        } catch (error) {
            if (error && error.errors[0] && error.errors[0].errorType === 'ValidationError') {
                this.get('model.errors').add(
                    'apiKey',
                    'The MailChimp API key is invalid.'
                );
                this.get('model.hasValidated').pushObject('apiKey');
                return false;
            } else if (error) {
                this.get('notifications').showAPIError(error);
                this.get('model.hasValidated').pushObject('apiKey');
                throw error;
            }
        }

        if (result && result.lists) {
            result.lists.forEach((list) => this.get('availableLists').pushObject(list));
        }

        // reset the active list if it doesn't exist in the available lists
        if (!this.get('availableLists').findBy('id', this.get('model.activeList.id'))) {
            if (result.lists.length) {
                this.set('model.activeList.id', result.lists[0].id);
                this.set('model.activeList.name', result.lists[0].name);
            } else {
                this.set('model.activeList.id', null);
                this.set('model.activeList.name', null);
            }

            this._triggerValidations();
        }

        // ensure we return a truthy value so the task button has a success state
        return true;
    }).drop(),

    save: task(function* () {
        let settings = this.get('settings');
        let model = this.get('model');
        let immediateSync = false;

        // if just activated there's an immediate background sync
        if (model.get('isActive') && !settings.get('isActive')) {
            immediateSync = true;
        }

        // if the active list changes there's an immediate bacground sync
        if (model.get('isActive') && model.get('activeList.id') !== settings.get('activeList.id')) {
            immediateSync = true;
        }

        yield this._triggerValidations();

        // Don't save when we have errors and properties are not validated
        if (model.get('errors.isActive') || model.get('errors.apiKey') || model.get('errors.activeList')) {
            return;
        }

        try {
            settings.set('mailchimp', this.get('model'));

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
            if (this.get('model.errors.isActive')) {
                this.get('model.errors.isActive').clear();
            }

            this.set('model.isActive', value);
            this._triggerValidations();
        },

        updateApiKey(value) {
            value = value ? value.toString().trim() : '';

            if (this.get('model.errors.apiKey')) {
                this.get('model.errors.apiKey').clear();
            }

            if (this.get('model.errors.isActive')) {
                this.get('model.errors.isActive').clear();
            }

            this.set('model.apiKey', value);
            this._triggerValidations();
        },

        fetchLists() {
            if (this.get('model.apiKey')) {
                this.get('fetchLists').perform();
            } else {
                this.set('availableLists', []);
            }
        },

        setList(list) {
            if (this.get('model.errors.activeList')) {
                this.get('model.errors.activeList').clear();
            }

            this.set('model.activeList.id', list.id);
            this.set('model.activeList.name', list.name);
            this._triggerValidations();
        },

        toggleDetails(property) {
            this.toggleProperty(property);
        }
    },

    _triggerValidations() {
        let isActive = this.get('model.isActive');
        let apiKey = this.get('model.apiKey');
        let noActiveList = this.get('noActiveList');
        let noAvailableLists = this.get('noAvailableLists');

        this.get('model.hasValidated').clear();

        if (isActive && !apiKey) {
            // CASE: API key is empty but MailChimp is enabled
            this.get('model.errors').add(
                'isActive',
                'You need to enter an API key before enabling it'
            );
            this.get('model.hasValidated').pushObject('isActive');
        } else if (apiKey && this.get('model.errors.apiKey')) {
            // CASE: API key was entered but we received an error message from the server
            // because the key is not valid. We don't want to overwrite this error
            this.get('model.hasValidated').pushObject('apiKey');
        } else if (!apiKey && !isActive && !noActiveList) {
            // CASE: when API key is empty and the app is disabled, we want to reset the saved list
            this.set('model.activeList.id', '');
            this.set('model.activeList.name', '');
        } else if (isActive && (apiKey && !this.get('model.errors.apiKey')) && noActiveList && !noAvailableLists) {
            let firstList = this.get('availableLists').objectAt(0);

            // CASE: App is enabled and a valid API key is entered but no list is selected
            // set first returned value as default
            this.set('model.activeList.id', firstList.id);
            this.set('model.activeList.name', firstList.name);

            this.get('model.hasValidated').pushObject('activeList');
        } else {
            // run the validation for API key
            this.get('model').validate({property: 'apiKey'});
        }
    }
});
