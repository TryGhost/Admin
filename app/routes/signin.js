import Route from 'ember-route';
import injectService from 'ember-service/inject';
import EmberObject from 'ember-object';
import Configuration from 'ember-simple-auth/configuration';

import styleBody from 'ghost-admin/mixins/style-body';
import validations from 'ghost-admin/utils/validations';

const ValidationMixin = validations('signin');
const SigninModel = EmberObject.extend(ValidationMixin, {
    identification: '',
    password: ''
});

export default Route.extend(styleBody, {
    titleToken: 'Sign In',

    classNames: ['ghost-login'],

    session: injectService(),

    beforeModel() {
        this._super(...arguments);

        if (this.get('session.isAuthenticated')) {
            this.transitionTo(Configuration.routeIfAlreadyAuthenticated);
        }
    },

    model() {
        return SigninModel.create();
    },

    // the deactivate hook is called after a route has been exited.
    deactivate() {
        let {controller} = this;

        this._super(...arguments);

        // clear the properties that hold the credentials when we're no longer on the signin screen
        controller.clearProperties();
    }
});
