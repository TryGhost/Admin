import {
    validatePresence,
    validateLength
} from 'ember-changeset-validations/validators';

export default {
    title: [
        validatePresence({
            presence: true,
            message: 'You must specify a title for the post.'
        }),
        validateLength({
            max: 150,
            message: 'Title cannot be longer than {max} characters'
        })
    ],
    metaTitle: validateLength({
        max: 150,
        allowBlank: true,
        message: 'Meta Title cannot be longer than {max} characters'
    }),
    metaDescription: validateLength({
        max: 200,
        allowBlank: true,
        message: 'Meta Description cannot be longer than {max} characters'
    })
};
