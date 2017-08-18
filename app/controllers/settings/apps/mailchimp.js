import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {alias, empty} from 'ember-computed';
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

        this.get('model.hasValidated').clear();

        // CASE: API key is empty but MailChimp is enabled
        if (isActive && !apiKey) {
            this.get('model.errors').add(
                'isActive',
                'You need to enter an API key before enabling it'
            );

            this.get('model.hasValidated').pushObject('isActive');
        } else {
            // run the validation for API key
            this.get('model').validate();
        }

        this.get('model.hasValidated').pushObject('isActive');
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
            if (error) {
                this.get('notifications').showAPIError(error);
                throw error;
            }
        }

        this.set('availableLists', result.lists);
    }).drop(),

    save: task(function* () {
        let mailchimp = this.get('model');
        let settings = this.get('settings');

        // Don't save when we have errors and properties are not validated
        if ((this.get('model.errors.isActive') || this.get('model.errors.apiKey'))) {
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

            this.set('model.apiKey', value);
            this._triggerValidations();
        },

        fetchLists() {
            this.get('_fetchMailingLists').perform();
        },

        changeList(list) {
            this.set('model.selectedList.id', list.id);
            this.set('model.selectedList.name', list.name);
        }
    }
});
