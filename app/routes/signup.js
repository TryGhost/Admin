import Route from 'ember-route';
import RSVP from 'rsvp';
import injectService from 'ember-service/inject';
import getOwner from 'ember-owner/get';

import Configuration from 'ember-simple-auth/configuration';
import styleBody from 'ghost-admin/mixins/style-body';
import NewUserModel from 'ghost-admin/models/new-user';

const {Promise} = RSVP;

export default Route.extend(styleBody, {
    classNames: ['ghost-signup'],

    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    ajax: injectService(),

    beforeModel() {
        this._super(...arguments);

        if (this.get('session.isAuthenticated')) {
            this.get('notifications').showAlert('You need to sign out to register as a new user.', {type: 'warn', delayed: true, key: 'signup.create.already-authenticated'});
            this.transitionTo(Configuration.routeIfAlreadyAuthenticated);
        }
    },

    model(params) {
        let re = /^(?:[A-Za-z0-9_\-]{4})*(?:[A-Za-z0-9_\-]{2}|[A-Za-z0-9_\-]{3})?$/;
        let {token} = params;
        let email,
            tokenText;

        return new Promise((resolve) => {
            if (!re.test(token)) {
                this.get('notifications').showAlert('Invalid token.', {type: 'error', delayed: true, key: 'signup.create.invalid-token'});

                return resolve(this.transitionTo('signin'));
            }

            tokenText = atob(token);
            email = tokenText.split('|')[1];

            let model = NewUserModel.create(getOwner(this).ownerInjection(), {email, token});
            let authUrl = this.get('ghostPaths.url').api('authentication', 'invitation');

            return this.get('ajax').request(authUrl, {
                dataType: 'json',
                data: {
                    email
                }
            }).then((response) => {
                if (response && response.invitation && response.invitation[0].valid === false) {
                    this.get('notifications').showAlert('The invitation does not exist or is no longer valid.', {type: 'warn', delayed: true, key: 'signup.create.invalid-invitation'});

                    return resolve(this.transitionTo('signin'));
                }

                resolve(model);
            }).catch(() => {
                resolve(model);
            });
        });
    }
});
