import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';
import {getOwner} from '@ember/application';
import {inject as injectService} from '@ember/service';

export default AuthenticatedRoute.extend(styleBody, {
    settings: injectService(),

    titleToken: 'Settings - Apps - MailChimp',
    classNames: ['settings-view-apps-mailchimp'],

    model() {
        let settings = this.get('settings.mailchimp');
        let mailchimp = new MailchimpIntegration({
            isActive: settings.isActive,
            apiKey: settings.apiKey,
            activeList: settings.activeList
        });

        return mailchimp;
    }
});
