import BaseValidator from './base';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['name'],

    name(model) {
        let name = model.get('name');
        let hasValidated = model.get('hasValidated');

        if (isBlank(name)) {
            model.get('errors').add('name', 'You must specify a name');
            this.invalidate();
        }

        hasValidated.addObject('name');
    }
});
