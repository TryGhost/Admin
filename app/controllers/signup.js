import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {isEmberArray} from 'ember-array/utils';

import {isVersionMismatchError} from 'ghost-admin/services/ajax';

const {Promise} = RSVP;

export default Controller.extend({
    submitting: false,
    flowErrors: '',

    notifications: injectService(),
    session: injectService(),
    config: injectService(),

    actions: {
        signup() {
            let changeset = this.get('model.changeset');

            this.toggleProperty('submitting');
            this.set('flowErrors', '');

            changeset.validate().then(() => {
                if (changeset.get('isInvalid')) {
                    this.toggleProperty('submitting');
                    this.set('flowErrors', 'Please fill out the form to complete your sign-up');
                    return;
                }

                let notifications = this.get('notifications');

                changeset.save().then(() => {
                    let {email, password} = this.get('model').getProperties('email', 'password');

                    this.get('session').authenticate('authenticator:oauth2', email, password).then(() => {
                        this.toggleProperty('submitting');

                        return this.get('session.user');
                    }).then((user) => {
                        return this.get('model').saveImage(user);
                    }).catch((resp) => {
                        notifications.showAPIError(resp, {key: 'signup.complete'});
                    });
                }).catch((error) => {
                    this.toggleProperty('submitting');

                    if (error && error.errors && isEmberArray(error.errors)) {
                        if (isVersionMismatchError(error)) {
                            notifications.showAPIError(error);
                        }
                        this.set('flowErrors', error.errors[0].message);
                    } else {
                        notifications.showAPIError(error, {key: 'signup.complete'});
                    }
                });
            });
        }
    }
});
