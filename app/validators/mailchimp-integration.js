import BaseValidator from './base';

export default BaseValidator.create({
    properties: ['apiKey', 'activeList'],

    async apiKey(model) {
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

        // TODO; check API key is actually valid

        hasValidated.addObject('apiKey');
    },

    activeList(model) {
        let {id} = model.get('activeList');
        let hasValidated = model.get('hasValidated');

        if (!id) {
            model.get('errors').add(
                'activeList',
                'A list to synchronise must be selected'
            );

            this.invalidate();
        }

        hasValidated.addObject('activeList');
    }
});
