import {
    validatePresence,
    validateFormat
} from 'ember-changeset-validations/validators';

export default {
    email: [
        validatePresence({
            presence: true,
            message: 'Please enter an email'
        }),
        validateFormat({
            type: 'email',
            message: 'Invalid email'
        })
    ],

    role: validatePresence({
        presence: true,
        message: 'You must supply a role'
    })
};
