import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import CurrentUserSettings from 'ghost-admin/mixins/current-user-settings';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

export default AuthenticatedRoute.extend(styleBody, CurrentUserSettings, {
    settings: service(),
    i18n: service(),

    classNames: ['settings'],
    titleToken: t('pageTitle.Settings - Labs'),

    beforeModel() {
        this._super(...arguments);
        return this.get('session.user')
            .then(this.transitionAuthor())
            .then(this.transitionEditor());
    },

    model() {
        return this.get('settings').reload();
    },

    resetController(controller, isExiting) {
        if (isExiting) {
            controller.reset();
        }
    }
});
