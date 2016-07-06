import {
    validatePresence,
    validateLength,
    validateConfirmation
} from 'ember-changeset-validations/validators';

export default {
    newPassword: [
        validatePresence({
            presence: true,
            message: 'Please enter a password'
        }),
        validateLength({
            min: 8,
            message: 'Password must be at least {min} characters long'
        })
    ],

    ne2Password: validateConfirmation({
        on: 'newPassword',
        message: 'The two new passwords don\'t match'
    })
};
