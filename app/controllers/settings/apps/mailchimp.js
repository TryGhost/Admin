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
    testRequestDisabled: empty('model.apiKey'),

    availableLists: null,

    isFetchingLists: readOnly('_fetchMailingLists.isRunning'),

    init() {
        this._super(...arguments);
        this.set('availableLists', []);
    },

    _triggerValidations() {
        let isActive = this.get('model.isActive');
        let apiKey = this.get('model.apiKey');
        let selectedList = !isEmpty(this.get('model.selectedList.id') || this.get('model.selectedList.name'));

        this.get('model.hasValidated').clear();

        // CASE: API key is empty but MailChimp is enabled
        if (isActive && !apiKey) {
            this.get('model.errors').add(
                'isActive',
                'You need to enter an API key before enabling it'
            );
            this.get('model.hasValidated').pushObject('isActive');
        } else if (apiKey && this.get('model.errors.apiKey')) {
            this.get('model.hasValidated').pushObject('apiKey');
        } else if (isActive && (apiKey && !this.get('model.errors.apiKey')) && !selectedList) {
            this.get('model.errors').add(
                'selectedList',
                'Please select a list'
            );
            this.get('model.hasValidated').pushObject('selectedList');
        } else if (isActive && selectedList && this.get('model.selectedList.id') === '1') {
            this.get('model.errors').add(
                'selectedList',
                'Please select a valid MailChimp list'
            );
            this.get('model.hasValidated').pushObject('selectedList');
        } else {
            // run the validation for API key
            this.get('model').validate();
        }
    },

    _fetchMailingLists: task(function* () {
        let url = this.get('ghostPaths.url').api('mailchimp', 'lists');
        let data = {apiKey: this.get('model.apiKey')};
        let result;

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
            // populate dropdown with an empty default value
            this.get('availableLists').pushObject({id: '1', name: ''});

            result.lists.forEach((list) => this.get('availableLists').pushObject(list));
        }
    }).drop(),

    save: task(function* () {
        let mailchimp = this.get('model');
        let settings = this.get('settings');

        yield this._triggerValidations();

        // Don't save when we have errors and properties are not validated
        if (this.get('model.errors.isActive') || this.get('model.errors.apiKey') || this.get('model.errors.selectedList')) {
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

        changeList(list) {
            if (this.get('model.errors.selectedList')) {
                this.get('model.errors.selectedList').clear();
            }

            this.set('model.selectedList.id', list.id);
            this.set('model.selectedList.name', list.name);
            this._triggerValidations();
        }
    }
});
