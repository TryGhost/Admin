import {
    validatePresence,
    validateLength,
    validateFormat
} from 'ember-changeset-validations/validators';

export default {
    name: [
        validatePresence({
            presence: true,
            message: 'You must specify a name for the tag'
        }),
        validateFormat({
            regex: /^,/,
            inverse: true,
            message: 'Tag names can\'t start with commas'
        }),
        validateLength({
            max: 150,
            message: 'Tag names cannot be longer than {max} characters'
        })
    ],

    slug: validateLength({
        max: 150,
        message: 'URL cannot be longer than {max} characters'
    }),

    description: validateLength({
        max: 200,
        message: 'Description cannot be longer than {max} characters'
    }),

    metaTitle: validateLength({
        max: 150,
        message: 'Meta Title cannot be longer than {max} characters'
    }),

    metaDescription: validateLength({
        max: 200,
        messsage: 'Meta Description cannot be longer than {max} characters'
    })
};
