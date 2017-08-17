import BaseValidator from './base';

export default BaseValidator.create({
    properties: ['apiKey'],

    apiKey(model) {
        let apiKey = model.get('apiKey');
        let hasValidated = model.get('hasValidated');

        let whiteSpaceRegex = new RegExp(/^\S*$/gi);

        if (!apiKey.match(whiteSpaceRegex)) {
            model.get('errors').add(
                'apiKey',
                'Please enter a valid API key for MailChimp'
            );

            this.invalidate();
        }

        hasValidated.addObject('apiKey');
    }
});
