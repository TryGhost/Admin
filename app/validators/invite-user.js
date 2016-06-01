import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isEmail from 'validator/lib/isEmail';

export default BaseValidator.create({
    properties: ['email'],

    email(model) {
        let email = model.get('email');

        if (isBlank(email)) {
            model.get('errors').add('email', 'Please enter an email.');
            this.invalidate();
        } else if (!isEmail(email)) {
            model.get('errors').add('email', 'Invalid Email.');
            this.invalidate();
        }
    }
});
