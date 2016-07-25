import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import computed from 'ember-computed';

export default Controller.extend({
    submitting: false,
    flowErrors: '',

    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    ajax: injectService(),

    email: computed('model.token', function () {
        // The token base64 encodes the email (and some other stuff),
        // each section is divided by a '|'. Email comes second.
        return atob(this.get('token')).split('|')[1];
    }),

    // Used to clear sensitive information
    clearData() {
        this.get('model').setProperties({
            newPassword: '',
            ne2Password: '',
            token: ''
        });
        this.get('model.changeset').rollback();
    },

    actions: {
        submit() {
            let changeset = this.get('changeset');

            this.set('flowErrors', '');
            changeset.validate().then(() => {
                if (changeset.get('isInvalid')) {
                    return;
                }

                // persist the changes to the model itself
                changeset.execute();

                let credentials = this.get('model').getProperties('newPassword', 'ne2Password', 'token');
                let authUrl = this.get('ghostPaths.url').api('authentication', 'passwordreset');

                this.toggleProperty('submitting');
                this.get('ajax').put(authUrl, {
                    data: {
                        passwordreset: [credentials]
                    }
                }).then((resp) => {
                    this.toggleProperty('submitting');
                    this.get('notifications').showAlert(resp.passwordreset[0].message, {type: 'warn', delayed: true, key: 'password.reset'});
                    this.get('session').authenticate('authenticator:oauth2', this.get('email'), credentials.newPassword);
                }).catch((error) => {
                    this.get('notifications').showAPIError(error, {key: 'password.reset'});
                    this.toggleProperty('submitting');
                });
            }).catch((error) => {
                if (changeset.get('error.newPassword')) {
                    this.set('flowErrors', changeset.get('error.newPassword.validation')[0]);
                }

                if (changeset.get('errors.ne2Password')) {
                    this.set('flowErrors', changeset.get('errors.ne2Password.validation')[0]);
                }

                if (changeset.get('isValid') === 0) {
                    throw error;
                }
            });
        }
    }
});
