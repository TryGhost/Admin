import {
    validatePresence,
    validateFormat
} from 'ember-changeset-validations/validators';

export default {
    identification: [
        validatePresence({
            presence: true,
            message: 'Please enter an email'
        }),
        validateFormat({
            type: 'email',
            message: 'Email address is not valid'
        })
    ],

    password: validatePresence({
        presence: true,
        message: 'Please enter a password'
    })
};
