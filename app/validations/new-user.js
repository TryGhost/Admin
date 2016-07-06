import {
    validatePresence,
    validateLength,
    validateFormat
} from 'ember-changeset-validations/validators';

export default {
    name: validatePresence({
        presence: true,
        message: 'Please enter a name'
    }),

    email: [
        validatePresence({
            presence: true,
            message: 'Please enter an email'
        }),
        validateFormat({
            type: 'email',
            message: 'Invalid Email'
        })
    ],

    password: [
        validatePresence({
            presence: true,
            message: 'Please supply a password'
        }),
        validateLength({
            min: 8,
            message: 'Password must be at least {min} characters long'
        })
    ]
};
