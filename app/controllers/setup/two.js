import classic from 'ember-classic-decorator';
import {inject as service} from '@ember/service';
/* eslint-disable camelcase, ghost/ember/alias-model-in-controller */
import Controller, {inject as controller} from '@ember/controller';
import RSVP from 'rsvp';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {action, get} from '@ember/object';
import {isInvalidError} from 'ember-ajax/errors';
import {isVersionMismatchError} from 'ghost-admin/services/ajax';
import {task} from 'ember-concurrency-decorators';

@classic
export default class TwoController extends Controller.extend(ValidationEngine) {
    @controller application;
    @service ajax;
    @service config;
    @service ghostPaths;
    @service notifications;
    @service session;
    @service settings;

    // ValidationEngine settings
    validationType = 'setup';

    blogCreated = false;
    blogTitle = null;
    email = '';
    flowErrors = '';
    profileImage = null;
    name = null;
    password = null;

    @action
    preValidate(model) {
        // Only triggers validation if a value has been entered, preventing empty errors on focusOut
        if (this.get(model)) {
            return this.validate({property: model});
        }
    }

    @action
    setImage(image) {
        this.set('profileImage', image);
    }

    @task
    *setup() {
        return yield this._passwordSetup();
    }

    @task
    *authenticate(authStrategy, authentication) {
        // we don't want to redirect after sign-in during setup
        this.set('session.skipAuthSuccessHandler', true);

        try {
            let authResult = yield this.session
                .authenticate(authStrategy, ...authentication);

            this.errors.remove('session');

            return authResult;
        } catch (error) {
            if (error && error.payload && error.payload.errors) {
                if (isVersionMismatchError(error)) {
                    return this.notifications.showAPIError(error);
                }

                error.payload.errors.forEach((err) => {
                    err.message = err.message.htmlSafe();
                });

                this.set('flowErrors', error.payload.errors[0].message.string);
            } else {
                // Connection errors don't return proper status message, only req.body
                this.notifications.showAlert('There was a problem on the server.', {type: 'error', key: 'session.authenticate.failed'});
            }
        }
    }

    /**
     * Uploads the given data image, then sends the changed user image property to the server
     * @param  {Object} user User object, returned from the 'setup' api call
     * @return {RSVP.Promise} A promise that takes care of both calls
     */
    _sendImage(user) {
        let formData = new FormData();
        let imageFile = this.profileImage;
        let uploadUrl = this.get('ghostPaths.url').api('images', 'upload');

        formData.append('file', imageFile, imageFile.name);
        formData.append('purpose', 'profile_image');

        return this.ajax.post(uploadUrl, {
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'text'
        }).then((response) => {
            let [image] = get(JSON.parse(response), 'images');
            let imageUrl = image.url;
            let usersUrl = this.get('ghostPaths.url').api('users', user.id.toString());
            user.profile_image = imageUrl;

            return this.ajax.put(usersUrl, {
                data: {
                    users: [user]
                }
            });
        });
    }

    _passwordSetup() {
        let setupProperties = ['blogTitle', 'name', 'email', 'password'];
        let data = this.getProperties(setupProperties);
        let config = this.config;
        let method = this.blogCreated ? 'put' : 'post';

        this.set('flowErrors', '');

        this.hasValidated.addObjects(setupProperties);

        return this.validate().then(() => {
            let authUrl = this.get('ghostPaths.url').api('authentication', 'setup');

            return this.ajax[method](authUrl, {
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

                return this.session.authenticate('authenticator:cookie', data.email, data.password).then(() => {
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
    }

    _handleSaveError(resp) {
        if (isInvalidError(resp)) {
            let [error] = resp.payload.errors;
            this.set('flowErrors', [error.message, error.context].join(' '));
        } else {
            this.notifications.showAPIError(resp, {key: 'setup.blog-details'});
        }
    }

    _handleAuthenticationError(error) {
        if (error && error.payload && error.payload.errors) {
            let [apiError] = error.payload.errors;
            this.set('flowErrors', [apiError.message, apiError.context].join(' '));
        } else {
            // Connection errors don't return proper status message, only req.body
            this.notifications.showAlert('There was a problem on the server.', {type: 'error', key: 'setup.authenticate.failed'});
        }
    }

    _afterAuthentication(result) {
        // fetch settings and private config for synchronous access before transitioning
        let fetchSettingsAndConfig = RSVP.all([
            this.settings.fetch()
        ]);

        if (this.profileImage) {
            return this._sendImage(result.users[0])
                .then(() => (fetchSettingsAndConfig))
                .then(() => (this.transitionToRoute('setup.three')))
                .catch((resp) => {
                    this.notifications.showAPIError(resp, {key: 'setup.blog-details'});
                });
        } else {
            return fetchSettingsAndConfig.then(() => this.transitionToRoute('setup.three'));
        }
    }
}
