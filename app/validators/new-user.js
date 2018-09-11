import PasswordValidator from 'ghost-admin/validators/password';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default PasswordValidator.extend({
    init() {
        this._super(...arguments);
        this.properties = this.properties || ['name', 'email', 'password'];
    },

    name(model) {
        let name = model.get('name');

        if (!validator.isLength(name || '', 1)) {
            model.get('errors').add('name', this.t('validation.Please enter a name.'));
            this.invalidate();
        }
    },

    email(model) {
        let email = model.get('email');

        if (isBlank(email)) {
            model.get('errors').add('email', this.t('validation.Please enter an email.'));
            this.invalidate();
        } else if (!validator.isEmail(email)) {
            model.get('errors').add('email', this.t('validation.Invalid Email.'));
            this.invalidate();
        }
    },

    password(model) {
        this.passwordValidation(model);
    }
});
