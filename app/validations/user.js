import {
    validatePresence,
    validateLength,
    validateFormat
} from 'ember-changeset-validations/validator';

export default {
    name: [
        validatePresence({
            presence: true,
            message: 'Please enter a name'
        }),
        validateLength({
            max: 150,
            message: 'Name cannot be longer than {max} characters'
        })
    ],

    bio: validateLength({
        max: 200,
        message: 'Bio cannot be longer than {max} characters'
    }),

    email: validateFormat({
        type: 'email',
        message: 'Please specify a valid email address'
    }),

    location: validateLength({
        max: 150,
        message: 'Location cannot be longer than {max} characters'
    }),

    website: [
        validateFormat({
            allowBlank: true,
            type: 'url',
            message: 'Website is not a valid URL'
        }),
        validateLength({
            max: 2000,
            message: 'Website cannot be longer than {max} characters'
        })
    ]
};
