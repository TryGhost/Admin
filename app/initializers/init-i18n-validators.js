import BaseValidator from 'ghost-admin/validators/base';
export function initialize(application) {
    //dirty hack to "inject" i18n into objects without containers
    BaseValidator.reopen({i18n: application.__container__.lookup('service:i18n')});
}

export default {
    name: 'i18n-validators',
    after: 'ember-i18n',
    initialize
};
