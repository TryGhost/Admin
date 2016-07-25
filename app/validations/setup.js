import {
    validatePresence,
    validateLength,
    validateFormat
} from 'ember-changeset-validations/validators';

import {assign} from 'ember-platform';
import NewUserValidations from './new-user';

export function validateInviteUsers() {
    let emailValidator = validateFormat({type: 'email'});

    return (key, value) => {
        let emailErrors = value.filter((email) => {
            return email.trim().length > 0;
        }).reduce((errors, email) => {
            if (emailValidator(key, email) !== true) {
                errors.push(`${email} is not a valid email`);
            }

            return errors;
        }, []);

        return emailErrors.length ? emailErrors : true;
    };
}

const SetupValidations = {
    blogTitle: [
        validatePresence({
            presence: true,
            message: 'Please enter a blog title'
        }),
        validateLength({
            max: 150,
            message: 'Blog title cannot be longer than {max} characters'
        })
    ],
    users: validateInviteUsers()
};

assign(SetupValidations, NewUserValidations);

export default SetupValidations;
