import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import CurrentUserSettings from 'ghost-admin/mixins/current-user-settings';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

export default AuthenticatedRoute.extend(styleBody, CurrentUserSettings, {
    settings: service(),
    i18n: service(),

    classNames: ['settings-view-apps'],
    titleToken: t('pageTitle.Settings - Apps'),

    beforeModel() {
        this._super(...arguments);
        return this.get('session.user')
            .then(this.transitionAuthor())
            .then(this.transitionEditor());
    },

    // we don't want to set the model property but we do want to ensure we have
    // up-to-date settings so pause via afterModel
    afterModel() {
        return this.get('settings').reload();
    }
});
