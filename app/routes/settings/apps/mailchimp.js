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
        let factory = getOwner(this).factoryFor('object:mailchimp-integration');

        return factory.create({
            isActive: settings.isActive,
            apiKey: settings.apiKey,
            activeList: {
                id: settings.activeList.id,
                name: settings.activeList.name
            }
        });
    }
});
