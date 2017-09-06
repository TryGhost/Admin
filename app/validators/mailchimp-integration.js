import BaseValidator from './base';

export default BaseValidator.create({
    properties: ['apiKey', 'apiKeyIsValid', 'activeList'],

    apiKey(model) {
        let apiKey = model.get('apiKey');
        let hasValidated = model.get('hasValidated');

        let whiteSpaceRegex = new RegExp(/^\S*$/gi);

        if (!apiKey) {
            model.get('errors').add(
                'apiKey',
                'Please enter an API key for MailChimp'
            );

            this.invalidate();

        } else if (!apiKey.match(whiteSpaceRegex)) {
            model.get('errors').add(
                'apiKey',
                'Please enter a valid API key for MailChimp'
            );

            this.invalidate();
        }

        hasValidated.addObject('apiKey');
    },

    apiKeyIsValid(model) {
        let hasValidated = model.get('hasValidated');

        if (model.get('errors').errorsFor('apiKey').length === 0) {
            return model.fetchLists().catch(() => {
                model.get('errors').add(
                    'apiKey',
                    'The MailChimp API key is invalid.'
                );

                this.invalidate();
            }).finally(() => {
                hasValidated.addObject('apiKey');
            });
        }
    },

    activeList(model) {
        let {id} = model.get('activeList');
        let hasValidated = model.get('hasValidated');

        if (!id) {
            model.get('errors').add(
                'activeList',
                'A mailing list to synchronise with is required'
            );

            this.invalidate();
        }

        hasValidated.addObject('activeList');
    }
});
