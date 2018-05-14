import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';
import {inject as service} from '@ember/service';
import {translationMacro as t} from 'ember-i18n';

export default AuthenticatedRoute.extend(styleBody, {
    ghostPaths: service(),
    ajax: service(),
    i18n: service(),

    classNames: ['view-about'],

    cachedConfig: false,

    titleToken: t('pageTitle.About'),

    model() {
        let cachedConfig = this.get('cachedConfig');
        let configUrl = this.get('ghostPaths.url').api('configuration', 'about');

        if (cachedConfig) {
            return cachedConfig;
        }

        return this.get('ajax').request(configUrl)
            .then((configurationResponse) => {
                let [cachedConfig] = configurationResponse.configuration;

                this.set('cachedConfig', cachedConfig);

                return cachedConfig;
            });
    }
});
