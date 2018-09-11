import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import CurrentUserSettings from 'ghost-admin/mixins/current-user-settings';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

export default AuthenticatedRoute.extend(styleBody, CurrentUserSettings, {
    settings: service(),
    i18n: service(),

    classNames: ['settings-view-code'],
    titleToken: t('pageTitle.Settings - Code Injection'),

    beforeModel() {
        this._super(...arguments);
        return this.get('session.user')
            .then(this.transitionAuthor())
            .then(this.transitionEditor());
    },

    model() {
        return this.get('settings').reload();
    },

    actions: {
        save() {
            this.get('controller').send('save');
        },

        willTransition(transition) {
            let controller = this.get('controller');
            let settings = this.get('settings');
            let modelIsDirty = settings.get('hasDirtyAttributes');

            if (modelIsDirty) {
                transition.abort();
                controller.send('toggleLeaveSettingsModal', transition);
                return;
            }
        }
    }
});
