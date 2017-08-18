import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as injectService} from '@ember/service';

export default AuthenticatedRoute.extend(styleBody, {
    feature: injectService(),
    notifications: injectService(),

    titleToken: 'Settings - Apps - MailChimp',

    classNames: ['settings-view-apps-mailchimp'],

    afterModel() {
        if (!this.get('feature.subscribers')) {
            this.get('notifications').showAlert('Subscribers feature is not enabled', {type: 'warn'});
        }
    },

    actions: {
        save() {
            this.get('controller').send('save');
        }
    }
});
