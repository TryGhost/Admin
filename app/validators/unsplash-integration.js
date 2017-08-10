import BaseValidator from './base';
import injectService from 'ember-service/inject';

export default BaseValidator.create({
    properties: ['applicationId', 'isActive'],

    config: injectService(),

    applicationId(model) {
        let applicationId = model.get('applicationId');
        let hasValidated = model.get('hasValidated');

        let whiteSpaceRegex = new RegExp(/^\S*$/gi);

        if (!applicationId.match(whiteSpaceRegex)) {
            model.get('errors').add(
                'applicationId',
                'Please enter a valid Application Id for Unsplash'
            );

            this.invalidate();
        }

        hasValidated.addObject('applicationId');
    },

    isActive(model) {
        let isActive = model.get('isActive');
        let applicationId = model.get('applicationId') || this.get('config.unsplashAPI');
        let hasValidated = model.get('hasValidated');

        if (!isActive && !validator.empty(applicationId)) {
            model.get('errors').add(
                'isActive',
                'Please enter an Application Id to enable Unsplash'
            );

            this.invalidate();
        }

        hasValidated.addObject('isActive');
    }
});
