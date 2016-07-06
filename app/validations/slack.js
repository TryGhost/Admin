import {validateFormat} from 'ember-changeset-validations/validators';

export default {
    url: validateFormat({
        allowBlank: true,
        regex: /(^https:\/\/hooks\.slack\.com\/services\/)(\S+)/,
        message: 'The URL must be in a format like https://hooks.slack.com/services/<your personal key>'
    })
};
