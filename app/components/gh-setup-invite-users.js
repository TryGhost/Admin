import Component from 'ember-component';
import computed from 'ember-computed';

import ChangesetValidationMixin from 'ghost-admin/mixins/changeset-validation';

export default Component.extend(ChangesetValidationMixin, {
    property: 'users',
    showErrors: false,

    classNames: 'form-group',
    classNameBindings: 'state',

    rawValue: computed('value', function () {
        return this.get('value').join('\n');
    }),

    actions: {
        update(value) {
            this._super(value.split('\n'));
        }
    }
});
