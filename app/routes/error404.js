import Route from '@ember/routing/route';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

export default Route.extend({
    i18n: service(),

    controllerName: 'error',
    templateName: 'error',
    titleToken: t('pageTitle.Error'),

    model() {
        return {
            status: 404
        };
    }
});
