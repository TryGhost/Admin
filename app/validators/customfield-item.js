import BaseValidator from './base';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['type', 'name'],

    type(model) {
        let type = model.get('type');
        let fieldTypes = model.get('fieldTypes');
        let hasValidated = model.get('hasValidated');

        if (!fieldTypes.includes(type)) {
            model.get('errors').add('type', 'You must specify a valid field type');
            this.invalidate();
        }

        hasValidated.addObject('type');
    },

    name(model) {
        let name = model.get('name');
        let hasValidated = model.get('hasValidated');

        if (isBlank(name)) {
            model.get('errors').add('name', 'You must specify a field name');
            this.invalidate();
        }

        hasValidated.addObject('name');
    }
});
