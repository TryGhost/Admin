import BaseValidator from './base';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({

    properties: ['email'],

    email(model) {
        let email = model.get('email');
        if (isBlank(email)) {
            model.get('errors').add('email', this.t('validation.Please enter an email.'));
            this.invalidate();
        } else if (!validator.isEmail(email)) {
            model.get('errors').add('email', this.t('validation.Invalid Email.'));
            this.invalidate();
        }
    }
});
