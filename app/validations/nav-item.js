import {
    validatePresence,
    validateFormat
} from 'ember-changeset-validation/validators';

const urlValidator = validateFormat({type: 'url'});

export function validateURL() {
    let urlRegex = new RegExp(/^(\/|#|[a-zA-Z0-9\-]+:)/);

    return (key, newValue) => {
        let test = (urlValidator(...arguments) && newValue.match(urlRegex));

        return (test === true) ? test : 'You must specify a valid URL or relative path';
    };
}

export default {
    label: validatePresence({
        presence: true,
        message: 'You must specify a label'
    }),

    url: [
        validatePresence({
            presence: true,
            message: 'You must specify a URL or relative path'
        }),
        validateURL()
    ]
};
