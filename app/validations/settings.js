import {
    validatePresence,
    validateLength
} from 'ember-changeset-validations/validators';

export function validatePassword() {
    let presence = validatePresence(true); // get presence validator

    return (key, newValue, oldValue, changes, content) => {
        if (content.get('isPrivate')) {
            return presence(key, newValue, oldValue, changes, content);
        }

        return true;
    };
}

export default {
    title: validateLength({max: 150, allowBlank: true}),
    description: validateLength({max: 200, allowBlank: true}),
    password: validatePassword()
};
