import BaseValidator from './base';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['name'],

    name(model) {
        let name = model.get('name');

        if (isBlank(name)) {
            model.get('errors').add('name', 'Please enter a name');
            model.get('hasValidated').pushObject('name');
            this.invalidate();
        } else if (!validator.isLength(name, 0, 191)) {
            model.get('errors').add('name', 'Name is too long, max 191 chars');
            model.get('hasValidated').pushObject('name');
            this.invalidate();
        }
    }
});
