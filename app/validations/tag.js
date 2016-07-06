import {
    validatePresence,
    validateLength
} from 'ember-changeset-validations/validators';

// TODO: temporary, remove once
// DockYard/ember-changeset-validations#43 is merged/released
export function validateInverseRegex({regex}) {
    return (key, newValue) => {
        if (newValue.match(regex)) {
            return 'Tag names can\'t start with commas';
        }

        return true;
    };
}

export default {
    name: [
        validatePresence({
            presence: true,
            message: 'You must specify a name for the tag'
        }),
        validateInverseRegex({regex: /^,/}),
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
