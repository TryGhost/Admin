import $ from 'jquery';
import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import injectController from 'ember-controller/inject';
import {isEmberArray} from 'ember-array/utils';

import {
    VersionMismatchError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';

export default Controller.extend({
    submitting: false,
    loggingIn: false,

    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    application: injectController(),
    ajax: injectService(),
    flowErrors: '',

    clearProperties() {
        let model = this.get('model');

        model.set('identification', '');
        model.set('password', '');

        model.get('changeset').rollback();
    },

    actions: {
        authenticate() {
            let model = this.get('model');
            let authStrategy = 'authenticator:oauth2';

            // Authentication transitions to posts.index, we can leave spinner running unless there is an error
            this.get('session').authenticate(authStrategy, model.get('identification'), model.get('password')).catch((error) => {
                this.toggleProperty('loggingIn');

                if (error && error.errors) {
                    // we don't get back an ember-data/ember-ajax error object
                    // back so we need to pass in a null status in order to
                    // test against the payload
                    if (isVersionMismatchError(null, error)) {
                        let versionMismatchError = new VersionMismatchError(error);
                        return this.get('notifications').showAPIError(versionMismatchError);
                    }

                    let changeset = this.get('model.changeset');

                    error.errors.forEach((err) => {
                        err.message = err.message.htmlSafe();
                    });

                    this.set('flowErrors', error.errors[0].message.string);

                    if (error.errors[0].message.string.match(/user with that email/)) {
                        changeset.addError('identification', 'Invalid username');
                    }

                    if (error.errors[0].message.string.match(/password is incorrect/)) {
                        changeset.addError('password', 'Invalid password');
                    }
                } else {
                    // Connection errors don't return proper status message, only req.body
                    this.get('notifications').showAlert('There was a problem on the server.', {type: 'error', key: 'session.authenticate.failed'});
                }
            });
        },

        validateAndAuthenticate() {
            this.set('flowErrors', '');
            // Manually trigger events for input fields, ensuring legacy compatibility with
            // browsers and password managers that don't send proper events on autofill
            $('#login').find('input').trigger('change');

            let changeset = this.get('model.changeset');

            changeset.validate().then(() => {
                if (changeset.get('isInvalid')) {
                    this.set('flowErrors', 'Please fill out the form to sign in.');
                    return;
                }

                // apply the property changes to the base object
                changeset.execute();

                this.toggleProperty('loggingIn');
                this.send('authenticate');
            }).catch((error) => {
                if (error) {
                    this.get('notifications').showAPIError(error, {key: 'signin.authenticate'});
                }
            });
        },

        forgotten() {
            let notifications = this.get('notifications');
            let changeset = this.get('model.changeset');

            this.set('flowErrors', '');
            changeset.clear();

            changeset.validate('identification').then(() => {
                // TODO: replace with identification.isInvalid when it is implemented upstream
                if (changeset.get('error.identification')) {
                    this.set('flowErrors', 'We need your email address to reset your password!');
                    return;
                }

                // persist property changes to model
                changeset.execute();

                let email = this.get('model.identification');
                let forgottenUrl = this.get('ghostPaths.url').api('authentication', 'passwordreset');
                this.toggleProperty('submitting');

                this.get('ajax').post(forgottenUrl, {
                    data: {
                        passwordreset: [{email}]
                    }
                }).then(() => {
                    this.toggleProperty('submitting');
                    notifications.showAlert('Please check your email for instructions.', {type: 'info', key: 'forgot-password.send.success'});
                }).catch((error) => {
                    this.toggleProperty('submitting');

                    if (isVersionMismatchError(error)) {
                        return notifications.showAPIError(error);
                    }

                    if (error && error.errors && isEmberArray(error.errors)) {
                        let [{message}] = error.errors;

                        this.set('flowErrors', message);

                        if (message.match(/no user with that email/)) {
                            changeset.addError('identification', 'Invalid email address');
                        }
                    } else {
                        notifications.showAPIError(error, {defaultErrorText: 'There was a problem with the reset, please try again.', key: 'forgot-password.send'});
                    }
                });
            });
        }
    }
});
