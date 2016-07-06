import {
    validatePresence,
    validateLength
} from 'ember-changeset-validations/validators';

import {assign} from 'ember-platform';
import NewUserValidations from './new-user';

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
    ]
};

assign(SetupValidations, NewUserValidations);

export default SetupValidations;
