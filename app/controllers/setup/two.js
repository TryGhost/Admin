/* eslint-disable camelcase */
import Controller from '@ember/controller';
import RSVP from 'rsvp';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {inject as injectController} from '@ember/controller';
import {inject as injectService} from '@ember/service';
import {isInvalidError} from 'ember-ajax/errors';
import {isVersionMismatchError} from 'ghost-admin/services/ajax';
import {task} from 'ember-concurrency';

export default Controller.extend(ValidationEngine, {
    ajax: injectService(),
    application: injectController(),
    config: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    settings: injectService(),

    // ValidationEngine settings
    validationType: 'setup',

    blogCreated: false,
    blogTitle: null,
    email: '',
    flowErrors: '',
    profileImage: null,
    name: null,
    password: null,

    setup: task(function* () {
        return yield this._passwordSetup();
    }),

    authenticate: task(function* (authStrategy, authentication) {
        // we don't want to redirect after sign-in during setup
        this.set('session.skipAuthSuccessHandler', true);

        try {
            let authResult = yield this.get('session')
                .authenticate(authStrategy, ...authentication);

            this.get('errors').remove('session');

            return authResult;

        } catch (error) {
            if (error && error.errors) {
                if (isVersionMismatchError(error)) {
                    return this.get('notifications').showAPIError(error);
                }

                error.errors.forEach((err) => {
                    err.message = err.message.htmlSafe();
                });

                this.set('flowErrors', error.errors[0].message.string);
            } else {
                // Connection errors don't return proper status message, only req.body
                this.get('notifications').showAlert('There was a problem on the server.', {type: 'error', key: 'session.authenticate.failed'});
            }
        }
    }),

    /**
     * Uploads the given data image, then sends the changed user image property to the server
     * @param  {Object} user User object, returned from the 'setup' api call
     * @return {Ember.RSVP.Promise} A promise that takes care of both calls
     */
    _sendImage(user) {
        let formData = new FormData();
        let imageFile = this.get('profileImage');
        let uploadUrl = this.get('ghostPaths.url').api('uploads');

        formData.append('uploadimage', imageFile, imageFile.name);

        return this.get('ajax').post(uploadUrl, {
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'text'
        }).then((response) => {
            let imageUrl = JSON.parse(response);
            let usersUrl = this.get('ghostPaths.url').api('users', user.id.toString());
            user.profile_image = imageUrl;

            return this.get('ajax').put(usersUrl, {
                data: {
                    users: [user]
                }
            });
        });
    },

    _passwordSetup() {
        let setupProperties = ['blogTitle', 'name', 'email', 'password'];
        let data = this.getProperties(setupProperties);
        let config = this.get('config');
        let method = this.get('blogCreated') ? 'put' : 'post';

        this.set('flowErrors', '');

        this.get('hasValidated').addObjects(setupProperties);

        return this.validate().then(() => {
            let authUrl = this.get('ghostPaths.url').api('authentication', 'setup');

            return this.get('ajax')[method](authUrl, {
                data: {
                    setup: [{
                        name: data.name,
                        email: data.email,
                        password: data.password,
                        blogTitle: data.blogTitle
                    }]
                }
            }).then((result) => {
                config.set('blogTitle', data.blogTitle);

                // don't try to login again if we are already logged in
                if (this.get('session.isAuthenticated')) {
                    return this._afterAuthentication(result);
                }

                // Don't call the success handler, otherwise we will be redirected to admin
                this.set('session.skipAuthSuccessHandler', true);

                return this.get('session').authenticate('authenticator:oauth2', this.get('email'), this.get('password')).then(() => {
                    this.set('blogCreated', true);
                    return this._afterAuthentication(result);
                }).catch((error) => {
                    this._handleAuthenticationError(error);
                }).finally(() => {
                    this.set('session.skipAuthSuccessHandler', undefined);
                });
            }).catch((error) => {
                this._handleSaveError(error);
            });
        }).catch(() => {
            this.set('flowErrors', 'Please fill out the form to setup your blog.');
        });
    },

    _handleSaveError(resp) {
        if (isInvalidError(resp)) {
            this.set('flowErrors', resp.errors[0].message);
        } else {
            this.get('notifications').showAPIError(resp, {key: 'setup.blog-details'});
        }
    },

    _handleAuthenticationError(error) {
        if (error && error.errors) {
            this.set('flowErrors', error.errors[0].message);
        } else {
            // Connection errors don't return proper status message, only req.body
            this.get('notifications').showAlert('There was a problem on the server.', {type: 'error', key: 'setup.authenticate.failed'});
        }
    },

    _afterAuthentication(result) {
        let promises = [];

        promises.pushObject(this.get('settings').fetch());
        promises.pushObject(this.get('config').fetchPrivate());

        if (this.get('profileImage')) {
            return this._sendImage(result.users[0])
                .then(() => {
                    // fetch settings and private config for synchronous access before transitioning
                    return RSVP.all(promises).then(() => {
                        return this.transitionToRoute('setup.three');
                    });
                }).catch((resp) => {
                    this.get('notifications').showAPIError(resp, {key: 'setup.blog-details'});
                });
        } else {
            // fetch settings and private config for synchronous access before transitioning
            return RSVP.all(promises).then(() => {
                return this.transitionToRoute('setup.three');
            });
        }
    },

    actions: {
        setup() {
            this.get('setup').perform();
        },

        preValidate(model) {
            // Only triggers validation if a value has been entered, preventing empty errors on focusOut
            if (this.get(model)) {
                return this.validate({property: model});
            }
        },

        setImage(image) {
            this.set('profileImage', image);
        }
    }
});
