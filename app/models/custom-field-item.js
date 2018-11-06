import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {computed} from '@ember/object';
import {isBlank} from '@ember/utils';

const FIELD_TYPES = ['Text', 'Number', 'Boolean'];

export default EmberObject.extend(ValidationEngine, {
    id: null,
    type: FIELD_TYPES[0],
    name: '',
    isNew: false,

    fieldTypes: FIELD_TYPES,

    validationType: 'customField',

    isComplete: computed('type', 'name', function () {
        let {type, name} = this.getProperties('type', 'name');

        return !isBlank(type) && !isBlank(name);
    }),

    isBlank: computed('type', 'name', function () {
        let {type, name} = this.getProperties('type', 'name');

        return isBlank(type) && isBlank(name);
    })
});
