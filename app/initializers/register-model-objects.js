import MailchimpIntegration from 'ghost-admin/models/mailchimp-integration';

export function initialize(application) {
    application.register(
        'object:mailchimp-integration',
        MailchimpIntegration,
        {singleton: false}
    );
}

export default {
    name: 'register-model-objects',
    initialize
};
