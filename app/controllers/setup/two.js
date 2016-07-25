import Controller from 'ember-controller';
import injectService from 'ember-service/inject';
import {isEmberArray} from 'ember-array/utils';

import SetupModel from 'ghost-admin/models/setup';
import createContainerObject from 'ghost-admin/utils/container-object';

export default Controller.extend({
    size: 90,

    model: null,
    submitting: false,
    flowErrors: '',

    notifications: injectService(),
    session: injectService(),
    config: injectService(),

    init() {
        this.set('model', createContainerObject(SetupModel, this));

        return this._super(...arguments);
    },

    _handleSaveError(resp) {
        this.toggleProperty('submitting');

        if (resp && resp.errors && isEmberArray(resp.errors)) {
            this.set('flowErrors', resp.errors[0].message);
        } else {
            this.get('notifications').showAPIError(resp, {key: 'setup.blog-details'});
        }
    },

    _handleAuthenticationError(error) {
        this.toggleProperty('submitting');
        if (error && error.errors) {
            this.set('flowErrors', error.errors[0].message);
        } else {
            // Connection errors don't return proper status message, only req.body
            this.get('notifications').showAlert('There was a problem on the server.', {type: 'error', key: 'setup.authenticate.failed'});
        }
    },

    _afterAuthentication() {
        return this.get('model').saveImage().then(() => {
            this.toggleProperty('submitting');
            this.transitionToRoute('setup.three');
        }).catch((resp) => {
            this.toggleProperty('submitting');
            this.get('notifications').showAPIError(resp, {key: 'setup.blog-details'});
        });
    },

    actions: {
        setup() {
            let changeset = this.get('model.changeset');

            this.toggleProperty('submitting');
            this.set('flowErrors', '');

            changeset.validate().then(() => {
                if (changeset.get('isInvalid')) {
                    this.toggleProperty('submitting');
                    this.set('flowErrors', 'Please fill out the form to setup your blog.');
                    return;
                }

                changeset.save().then(() => {
                    // don't try to login again if we are already logged in
                    if (this.get('session.isAuthenticated')) {
                        return this._afterAuthentication();
                    }

                    let {email, password} = this.get('model').getProperties('email', 'password');

                    // Don't call the success handler, otherwise we will be redirected to admin
                    this.set('session.skipAuthSuccessHandler', true);
                    this.get('session').authenticate('authenticator:oauth2', email, password).then(() => {
                        this.set('model.created', true);
                        return this._afterAuthentication();
                    }).catch((error) => {
                        this._handleAuthenticationError(error);
                    }).finally(() => {
                        this.set('session.skipAuthSuccessHandler', undefined);
                    });
                }).catch((error) => {
                    this._handleSaveError(error);
                });
            });
        }
    }
});
