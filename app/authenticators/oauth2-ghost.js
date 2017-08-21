import Oauth2Authenticator from './oauth2';
import RSVP from 'rsvp';
import {assign} from '@ember/polyfills';
import {isEmpty} from '@ember/utils';
import {run} from '@ember/runloop';
import {makeArray as wrap} from '@ember/array';

export default Oauth2Authenticator.extend({
    // TODO: all this is doing is changing the `data` structure, we should
    // probably create our own token auth, maybe look at
    // https://github.com/jpadilla/ember-simple-auth-token
    authenticate(identification, password, scope = []) {
        return new RSVP.Promise((resolve, reject) => {
            // const data                = { 'grant_type': 'password', username: identification, password };
            let data = identification;
            let serverTokenEndpoint = this.get('serverTokenEndpoint');
            let scopesString = wrap(scope).join(' ');

            // eslint-disable-next-line camelcase
            data.grant_type = 'authorization_code';

            if (!isEmpty(scopesString)) {
                data.scope = scopesString;
            }

            this.makeRequest(serverTokenEndpoint, data).then((response) => {
                run(() => {
                    let expiresAt = this._absolutizeExpirationTime(response.expires_in);
                    this._scheduleAccessTokenRefresh(response.expires_in, expiresAt, response.refresh_token);
                    if (!isEmpty(expiresAt)) {
                        response = assign(response, {'expires_at': expiresAt});
                    }
                    resolve(response);
                });
            }, (error) => {
                reject(error);
            });
        });
    }
});
