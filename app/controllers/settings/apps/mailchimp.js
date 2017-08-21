import Controller from 'ember-controller';
import computed, {alias, empty, or} from 'ember-computed';
import injectService from 'ember-service/inject';
import {isEmpty} from '@ember/utils';
import {task} from 'ember-concurrency';

export default Controller.extend({
    ajax: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),
    settings: injectService(),
    feature: injectService(),

    availableLists: null,

    listSelectDisabled: or('noAvailableLists', 'syncButtonDisabled', 'fetchLists.isRunning'),
    model: alias('settings.mailchimp'),
    noActiveList: empty('model.activeList.id'),
    noAvailableLists: empty('availableLists'),
    syncButtonDisabled: empty('model.apiKey'),

    selectedList: computed('model.activeList.id', 'availableLists.[]', function () {
        let selectedId = this.get('model.activeList.id');
        let availableLists = this.get('availableLists');

        return availableLists.findBy('id', selectedId);
    }),

    _triggerValidations() {
        let isActive = this.get('model.isActive');
        let apiKey = this.get('model.apiKey');
        // the CP `noActiveList` didn't change on model changes...
        let noActiveList = isEmpty(this.get('model.activeList.id') || this.get('model.activeList.name'));

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
        } else if (isActive && (apiKey && !this.get('model.errors.apiKey')) && noActiveList) {
            // CASE: App is enabled and a valid API key is entered but no list is selected
            this.get('model.errors').add(
                'activeList',
                'Please select a list'
            );
            this.get('model.hasValidated').pushObject('activeList');
        } else {
            // run the validation for API key
            this.get('model').validate();
        }
    },

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

        // ensure we return a truthy value so the task button as a success state
        return true;
    }).drop(),

    save: task(function* () {
        let mailchimp = this.get('model');
        let settings = this.get('settings');

        yield this._triggerValidations();

        // Don't save when we have errors and properties are not validated
        if (this.get('model.errors.isActive') || this.get('model.errors.apiKey') || this.get('model.errors.activeList')) {
            return;
        }

        try {
            settings.set('mailchimp', mailchimp);
            return yield settings.save();
        } catch (error) {
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            }
        }
    }).drop(),

    // TODO: replace with real implementation
    sync: task(function* () {
        let url = this.get('ghostPaths.url').api('mailchimp', 'sync');

        return yield this.get('ajax').request(url).then((results) => {
            // TODO: display sync statistics
            console.log(results);
        });
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

        updateApi(value) {
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
            this._triggerValidations();

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
        }
    }
});
