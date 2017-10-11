import Service from '@ember/service';
import fetch from 'fetch';
import semverCompare from 'ghost-admin/utils/semver-compare';
import {readOnly} from '@ember/object/computed';
import {resolve} from 'rsvp';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Service.extend({
    config: service(),

    isAllowed: readOnly('config.allowUpgradeCheck'),
    upgradeMessage: null,

    check: task(function* (version) {
        if (this.get('isAllowed')) {
            let updateService = 'https://updates.ghost.org/?lts=false';
            let response = yield fetch(updateService)
                .then((response) => this._checkStatus(response))
                .then((response) => response.json());

            // 1  if upgrade available
            // 0  if on current version
            // -1 if we're on a newer version - not sure how that should be possible!
            let requiresUpgrade = semverCompare(response.version, version);

            if (requiresUpgrade) {
                this.set('upgradeMessage', response.messages[0].content);
            } else {
                this.set('upgradeMessage', 'You\'re up-to-date!');
            }
        }
    }),

    _checkStatus(response) {
        // successful request
        if (response.status >= 200 && response.status < 300) {
            return resolve(response);
        }

        let responseTextPromise = resolve();

        if (response.headers.map['content-type'] === 'application/json') {
            responseTextPromise = response.json().then((json) => {
                return json.errors[0];
            });
        } else if (response.headers.map['content-type'] === 'text/xml') {
            responseTextPromise = response.text();
        }

        return responseTextPromise.then((responseText) => {
            // throw error to prevent further processing
            let error = new Error(responseText);
            error.response = response;
            throw error;
        });
    }

});
