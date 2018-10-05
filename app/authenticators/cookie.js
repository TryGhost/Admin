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

    authenticate(identification, password) {
        const data = {username: identification, password};
        const sessionEndpoint = this.get('sessionEndpoint');
        const options = {
            data,
            contentType: 'application/json;charset=utf-8',
            // ember-ajax will try and parse the response as JSON if not explicitly set
            dataType: 'text'
        };

        return this.get('ajax').post(sessionEndpoint, options);
    },

    invalidate() {
        // if we're invalidating because of a 401 we can end up in an infinite
        // loop if we then try to perform a DELETE /session/ request
        // TODO: find a more elegant way to handle this
        if (this.ajax.skipSessionDeletion) {
            this.ajax.skipSessionDeletion = false;
            return RSVP.resolve();
        }

        let sessionEndpoint = this.get('sessionEndpoint');
        return this.get('ajax').del(sessionEndpoint);
    }
});
