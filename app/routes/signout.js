import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import Ember from 'ember';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

// ember-cli-shims doesn't export canInvoke
const {canInvoke} = Ember;

export default AuthenticatedRoute.extend(styleBody, {
    notifications: service(),
    i18n: service(),

    classNames: ['ghost-signout'],

    titleToken: t('pageTitle.Sign Out'),

    afterModel(model, transition) {
        this.get('notifications').clearAll();
        if (canInvoke(transition, 'send')) {
            transition.send('logout');
        } else {
            this.send('logout');
        }
    }
});
