import DS from 'ember-data';
import EmberObject from '@ember/object';
import Route from '@ember/routing/route';
import UnauthenticatedRouteMixin from 'ghost-admin/mixins/unauthenticated-route-mixin';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

const {Errors} = DS;

const defaultModel = function defaultModel() {
    return EmberObject.create({
        identification: '',
        password: '',
        errors: Errors.create()
    });
};

export default Route.extend(UnauthenticatedRouteMixin, styleBody, {
    i18n: service(),

    classNames: ['ghost-login'],

    titleToken: t('pageTitle.Sign In'),

    model() {
        return defaultModel();
    },

    // the deactivate hook is called after a route has been exited.
    deactivate() {
        let controller = this.controllerFor('signin');

        this._super(...arguments);

        // clear the properties that hold the credentials when we're no longer on the signin screen
        controller.set('signin', defaultModel());
    }
});
