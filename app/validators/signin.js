import BaseValidator from './base';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['identification', 'signin', 'forgotPassword'],

    identification(model) {
        let id = model.get('identification');

        if (!isBlank(id) && !validator.isEmail(id)) {
            model.get('errors').add('identification', this.t('validation.Email address is not valid'));
            this.invalidate();
        }
    },

    signin(model) {
        let id = model.get('identification');
        let password = model.get('password');

        model.get('errors').clear();

        if (isBlank(id)) {
            model.get('errors').add('identification', this.t('validation.Please enter an email.'));
            this.invalidate();
        }

        if (!isBlank(id) && !validator.isEmail(id)) {
            model.get('errors').add('identification', this.t('validation.Email address is not valid'));
            this.invalidate();
        }

        if (isBlank(password)) {
            model.get('errors').add('password', this.t('validation.Please enter a password.'));
            this.invalidate();
        }
    },

    forgotPassword(model) {
        let id = model.get('identification');

        model.get('errors').clear();

        if (isBlank(id) || !validator.isEmail(id)) {
            model.get('errors').add('identification', this.t('validation.Email address is not valid'));
            this.invalidate();
        }
    }
});
