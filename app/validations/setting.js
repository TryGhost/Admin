import {
    validatePresence,
    validateLength,
    validateNumber
} from 'ember-changeset-validations/validators';

export function privatePaswordValidator() {
    let presenceValidator = validatePresence({
        presence: true,
        message: 'Password must be supplied'
    });

    return (key, newValue, oldValue, changes) => {
        if (changes.isPrivate || oldValue) {
            return presenceValidator(...arguments);
        }

        return true;
    };
}

export default {
    title: validateLength({
        max: 150,
        message: 'Title cannot be longer than {max} characters'
    }),

    description: validateLength({
        max: 200,
        message: 'Description cannot be longer than {max} characters'
    }),

    password: privatePaswordValidator(),

    postsPerPage: validateNumber({
        integer: true,
        gt: 1,
        lt: 1000,
        message(key, type) {
            if (type === 'notAnInteger') {
                return 'Posts per page must be a number';
            }

            if (type === 'greaterThan') {
                return 'The maximum number of posts per page is 1000';
            }

            if (type === 'lessThan') {
                return 'The minimum number of posts per page is 1';
            }
        }
    })
};
