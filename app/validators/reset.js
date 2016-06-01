import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isLength from 'validator/lib/isLength';
import equals from 'validator/lib/equals';

export default BaseValidator.create({
    properties: ['newPassword'],

    newPassword(model) {
        let p1 = model.get('newPassword');
        let p2 = model.get('ne2Password');

        if (isBlank(p1)) {
            model.get('errors').add('newPassword', 'Please enter a password.');
            this.invalidate();
        } else if (!isLength(p1, 8)) {
            model.get('errors').add('newPassword', 'The password is not long enough.');
            this.invalidate();
        } else if (!equals(p1, p2)) {
            model.get('errors').add('ne2Password', 'The two new passwords don\'t match.');
            this.invalidate();
        }
    }
});
