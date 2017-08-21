import Controller from 'ember-controller';
import computed, {alias, empty} from 'ember-computed';
import injectService from 'ember-service/inject';
import {isEmpty} from '@ember/utils';
import {readOnly} from '@ember/object/computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    ajax: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),
    settings: injectService(),
    feature: injectService(),

    model: alias('settings.mailchimp'),
    syncButtonDisabled: empty('model.apiKey'),
    noAvailableListsFetched: empty('model.availableLists'),
    noActiveList: computed('model.activeList', function () {
        return (isEmpty(this.get('model.activeList.id') || this.get('model.activeList.name')));
    }),

    isFetchingLists: readOnly('_fetchMailingLists.isRunning'),

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

    _fetchMailingLists: task(function* () {
        let url = this.get('ghostPaths.url').api('mailchimp', 'lists');
        let data = {apiKey: this.get('model.apiKey')};
        let result;

        // clear available lists
        this.set('model.availableLists', []);

        // don't fetch mailing lists, when no API key is entered
        if (!this.get('model.apiKey')) {
            return;
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
            } else if (error) {
                this.get('notifications').showAPIError(error);
                this.get('model.hasValidated').pushObject('apiKey');
                throw error;
            }
        }

        if (result && result.lists) {
            result.lists.forEach((list) => this.get('model.availableLists').pushObject(list));
        }
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

    actions: {
        save() {
            this.get('save').perform();
        },

        update(value) {
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
            this.get('_fetchMailingLists').perform();
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
