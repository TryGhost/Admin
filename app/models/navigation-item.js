import computed from 'ember-computed';
import {isBlank} from 'ember-utils';
import EmberObject from 'ember-object';

import validations from 'ghost-admin/utils/validations';

const ValidationsMixin = validations('navItem');

export default EmberObject.extend(ValidationsMixin, {
    label: '',
    url: '',
    isNew: false,

    isComplete: computed('label', 'url', function () {
        let {label, url} = this.getProperties('label', 'url');

        return !isBlank(label) && !isBlank(url);
    }),

    isBlank: computed('label', 'url', function () {
        let {label, url} = this.getProperties('label', 'url');

        return isBlank(label) && isBlank(url);
    })
});
