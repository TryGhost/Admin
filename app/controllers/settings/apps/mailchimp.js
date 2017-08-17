import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {alias, empty} from 'ember-computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: injectService(),
    settings: injectService(),

    model: alias('settings.mailchimp'),
    testRequestDisabled: empty('model.apiKey'),
    apiUrl: 'https://us16.api.mailchimp.com/3.0',

    isFetchingLists: false,
    availableLists: [],
    _scratchApiKey: null,

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

    _makeRequest(url) {
        let headers = {};

        // clear any previous error
        this.set('error', '');

        headers.Authorization = `apikey ${this.get('model.apiKey')}`;
        // TODO: make request to mailchimp/lists enpoint with added _scratchApiKey
        // return fetch(url, {headers})
        //     .then((response) => response.json())
        //     .then((response) => this._addListsFromResponse(response))
        //     .catch(() => {
        //         // if the error text isn't already set then we've get a connection error from `fetch`
        //         if (!this.get('error')) {
        //             this.set('error', 'Uh-oh! Trouble reaching the Unsplash API, please check your connection');
        //         }
        //     });
    },

    _addListsFromResponse(response) {
        let lists = response.results || response;

        this.set('isFetchingLists', false);

        lists.forEach((list) => this.get('availableLists').pushObject(list));
    },

    _fetchMailingLists: task(function* () {
        let url = `${this.get('apiUrl')}/lists`;

        yield this.get('model').validate({property: 'apiKey'});

        this.set('isFetchingLists', true);
        yield this._makeRequest(url);
        this.set('isFetchingLists', false);
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

        changeList() {
            // TODO: change selected list value here
        }
    }
});
