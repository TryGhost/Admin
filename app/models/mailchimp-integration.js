import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {inject as injectService} from '@ember/service';

export default EmberObject.extend(ValidationEngine, {
    ajax: injectService(),
    ghostPaths: injectService(),

    validationType: 'mailchimpIntegration',

    // values entered here will act as defaults
    isActive: false,
    apiKey: '',
    activeList: {},

    fetchLists() {
        let url = this.get('ghostPaths.url').api('mailchimp', 'lists');
        let data = {apiKey: this.get('apiKey')};

        return this.get('ajax').request(url, {data});
    }
});
