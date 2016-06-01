import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isEmail from 'validator/lib/isEmail';

export default BaseValidator.create({
    properties: ['identification', 'signin', 'forgotPassword'],
    invalidMessage: 'Email address is not valid',

    identification(model) {
        let id = model.get('identification');

        if (!isBlank(id) && !isEmail(id)) {
            model.get('errors').add('identification', this.get('invalidMessage'));
            this.invalidate();
        }
    },

    signin(model) {
        let id = model.get('identification');
        let password = model.get('password');

        model.get('errors').clear();

        if (isBlank(id)) {
            model.get('errors').add('identification', 'Please enter an email');
            this.invalidate();
        }

        if (!isBlank(id) && !isEmail(id)) {
            model.get('errors').add('identification', this.get('invalidMessage'));
            this.invalidate();
        }

        if (isBlank(password)) {
            model.get('errors').add('password', 'Please enter a password');
            this.invalidate();
        }
    },

    forgotPassword(model) {
        let id = model.get('identification');

        model.get('errors').clear();

        if (isBlank(id) || !isEmail(id)) {
            model.get('errors').add('identification', this.get('invalidMessage'));
            this.invalidate();
        }
    }
});
