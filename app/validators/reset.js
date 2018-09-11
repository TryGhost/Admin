import PasswordValidator from 'ghost-admin/validators/password';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default PasswordValidator.create({
    properties: ['newPassword'],

    newPassword(model) {
        let p1 = model.get('newPassword');
        let p2 = model.get('ne2Password');

        if (isBlank(p1)) {
            model.get('errors').add('newPassword', this.t('validation.Please enter a password.'));
            this.invalidate();
        } else if (!validator.equals(p1, p2 || '')) {
            model.get('errors').add('ne2Password', this.t('validation.The two new passwords don\'t match.'));
            this.invalidate();
        }

        this.passwordValidation(model, p1, 'newPassword');
    }
});
