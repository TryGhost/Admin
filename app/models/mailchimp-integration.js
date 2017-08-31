import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';

export default EmberObject.extend(ValidationEngine, {
    validationType: 'mailchimpIntegration',

    // values entered here will act as defaults
    isActive: false,
    apiKey: '',
    activeList: {}
});
