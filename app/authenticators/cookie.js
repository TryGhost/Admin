import Authenticator from 'ember-simple-auth/authenticators/base';
import RSVP from 'rsvp';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Authenticator.extend({
    ajax: service(),
    ghostPaths: service(),

    sessionEndpoint: computed('ghostPaths.apiRoot', function () {
        return `${this.get('ghostPaths.apiRoot')}/session`;
    }),

    restore: function () {
        return RSVP.resolve();
    },

    // disable general token revocation because the requests will always 401
    // (revocation is triggered by invalid access token so it's already invalid)
    // we have a separate logout procedure that sends revocation requests

    authenticate(identification, password) {
        // no need to do anything with the response - the browser will store the cookie in case of a successful request
        const data = {username: identification, password};
        const sessionEndpoint = this.get('sessionEndpoint');
        const options = {
            data,
            contentType: 'application/json;charset=utf-8'
        };

        return this.get('ajax').post(sessionEndpoint, options);
    },

    invalidate() {
        // no need to do anything with the response - the browser will store the cookie in case of a successful request
        let sessionEndpoint = this.get('sessionEndpoint');
        return this.get('ajax').del({
            url: sessionEndpoint,
            type: 'DELETE'
        });
    }
});
