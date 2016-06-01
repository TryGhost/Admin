import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';

export default BaseValidator.extend({
    properties: ['name', 'email', 'password'],

    name(model) {
        let name = model.get('name');

        if (!isLength(name, 1)) {
            model.get('errors').add('name', 'Please enter a name.');
            this.invalidate();
        }
    },

    email(model) {
        let email = model.get('email');

        if (isBlank(email)) {
            model.get('errors').add('email', 'Please enter an email.');
            this.invalidate();
        } else if (!isEmail(email)) {
            model.get('errors').add('email', 'Invalid Email.');
            this.invalidate();
        }
    },

    password(model) {
        let password = model.get('password');

        if (!isLength(password, 8)) {
            model.get('errors').add('password', 'Password must be at least 8 characters long');
            this.invalidate();
        }
    }
});
