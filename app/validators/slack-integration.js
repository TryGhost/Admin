import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';

export default BaseValidator.create({
    properties: ['url'],

    url(model) {
        let url = model.get('url');
        let hasValidated = model.get('hasValidated');

        let urlRegex = new RegExp(/(^https:\/\/hooks\.slack\.com\/services\/)(\S+)/);

        if (!isBlank(url) && !url.match(urlRegex)) {
            model.get('errors').add(
                'url',
                'The URL must be in a format like ' +
                    'https://hooks.slack.com/services/<your personal key>'
            );

            this.invalidate();
        }

        hasValidated.addObject('url');
    }
});
