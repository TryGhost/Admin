import Controller from 'ember-controller';
import fetch from 'fetch';
import injectService from 'ember-service/inject';
import {alias, empty} from 'ember-computed';
import {resolve} from 'rsvp';
import {task} from 'ember-concurrency';

const API_URL = 'https://us16.api.mailchimp.com/3.0';

export default Controller.extend({
    notifications: injectService(),
    settings: injectService(),
    config: injectService(),

    model: alias('settings.mailchimp'),
    testRequestDisabled: empty('model.apiKey'),

    isFetchingLists: false,
    availableLists: [],

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

    _checkStatus(response) {
        // successful request
        if (response.status >= 200 && response.status < 300) {
            console.log('resolve response in checkStatus');
            return resolve(response);
        }

        let errorText = '';
        let responseTextPromise = resolve();

        if (response.headers.map['content-type'] === 'application/json') {
            responseTextPromise = response.json().then((json) => {
                return json.errors[0];
            });
        } else if (response.headers.map['content-type'] === 'text/xml') {
            responseTextPromise = response.text();
        }

        return responseTextPromise.then((responseText) => {
            if (response.status === 403 && response.headers.map['x-ratelimit-remaining'] === '0') {
                // we've hit the ratelimit on the API
                errorText = 'Unsplash API rate limit reached, please try again later.';
            }

            errorText = errorText || responseText || `Error ${response.status}: Uh-oh! Trouble reaching the Unsplash API`;

            // set error text for display in UI
            this.set('error', errorText);

            // throw error to prevent further processing
            let error = new Error(errorText);
            error.response = response;
            throw error;
        });
    },

    _makeRequest(url) {
        let options = {};

        // clear any previous error
        this.set('error', '');

        options.url = url;
        options.headers = {
            Authorization: `apikey ${this.get('model.apiKey')}`,
            'Access-Control-Allow-Origin': 'origin',
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };

        return fetch(options)
            .then((response) => this._checkStatus(response))
            .then((response) => this._extractPagination(response))
            .then((response) => response.json())
            .then((response) => this._addListsFromResponse(response))
            .catch(() => {
                // if the error text isn't already set then we've get a connection error from `fetch`
                if (!this.get('error')) {
                    this.set('error', 'Uh-oh! Trouble reaching the Unsplash API, please check your connection');
                }
            });
    },

    _addListsFromResponse(response) {
        console.log('response in _addListsFromResponse:', response);
        let lists = response.results || response;

        console.log('lists in _addListsFromResponse:', lists);

        lists.forEach((list) => {
            console.log('list:', list);
            this.get('availableLists').pushObject(list);
        });

        this.set('isFetchingLists', false);
    },

    _extractPagination(response) {
        let pagination = {};
        let linkRegex = new RegExp('<(.*)>; rel="(.*)"');
        let {link} = response.headers.map;

        if (link) {
            link.split(',').forEach((link) => {
                let [, url, rel] = linkRegex.exec(link);

                pagination[rel] = url;
            });
        }

        this._pagination = pagination;
        console.log('extract pagination returns');
        return response;
    },

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

    _fetchMailingLists: task(function* () {
        let url = `${API_URL}/lists`;

        yield this.get('model').validate({property: 'apiKey'});
        yield this.get('save').perform();

        this.set('isFetchingLists', true);
        return this._makeRequest(url);
        // let notifications = this.get('notifications');
        // let apiKey = this.get('model.apiKey');

        // try {
        //     yield this.get('unsplash').sendTestRequest(apiKey);
        // } catch (error) {
        //     notifications.showAPIError(error, {key: 'unsplash-test:send'});
        //     return false;
        // }

        // save the application id when it's valid

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

        changeList(value) {

        }
    }
});
