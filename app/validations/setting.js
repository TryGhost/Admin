import {validateLength} from 'ember-changeset-validations/validators';

export default {
    title: validateLength({
        max: 150,
        message: 'Title cannot be longer than {max} characters'
    }),

    description: validateLength({
        max: 200,
        message: 'Description cannot be longer than {max} characters'
    })
};
