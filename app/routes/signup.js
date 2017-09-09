import DS from 'ember-data';
import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ghost-admin/mixins/unauthenticated-route-mixin';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as injectService} from '@ember/service';

const {Promise} = RSVP;
const {Errors} = DS;

export default Route.extend(styleBody, UnauthenticatedRouteMixin, {
    classNames: ['ghost-signup'],

    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    ajax: injectService(),

    beforeModel() {
        if (this.get('session.isAuthenticated')) {
            this.get('notifications').showAlert('You need to sign out to register as a new user.', {type: 'warn', delayed: true, key: 'signup.create.already-authenticated'});
        }

        this._super(...arguments);
    },

    model(params) {
        let model = EmberObject.create();
        let re = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}|[A-Za-z0-9_-]{3})?$/;
        let email,
            tokenText;

        return new Promise((resolve) => {
            if (!re.test(params.token)) {
                this.get('notifications').showAlert('Invalid token.', {type: 'error', delayed: true, key: 'signup.create.invalid-token'});

                return resolve(this.transitionTo('signin'));
            }

            tokenText = atob(params.token);
            email = tokenText.split('|')[1];

            model.set('email', email);
            model.set('token', params.token);
            model.set('errors', Errors.create());

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

                model.set('invitedBy', response.invitation[0].invitedBy);

                resolve(model);
            }).catch(() => {
                resolve(model);
            });
        });
    },

    deactivate() {
        this._super(...arguments);

        // clear the properties that hold the sensitive data from the controller
        this.controllerFor('signup').setProperties({email: '', password: '', token: ''});
    }
});
