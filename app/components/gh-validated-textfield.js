import Component from 'ember-component';
import {scheduleOnce} from 'ember-runloop';

import ChangesetValidationMixin from 'ghost-admin/mixins/changeset-validation';

const ValidatedTextfield = Component.extend(ChangesetValidationMixin, {
    classNames: 'form-group',
    classNameBindings: 'state',

    inputId: '',
    type: 'text',
    name: '',
    placeholder: '',
    label: '',
    helpText: '',
    disabled: false,

    // text input mixin parameters
    selectOnClick: false,
    stopEnterKeyDownPropagation: false,

    // other options
    readonly: null,
    size: null,
    maxlength: null,
    autocomplete: null,
    autofocus: null,
    novalidate: null,
    min: null,
    max: null,
    pattern: null,

    didInsertElement() {
        this._super(...arguments);

        scheduleOnce('afterRender', () => {
            this.set('inputId', this.$('input').attr('id'));
        });
    }
});

ValidatedTextfield.reopenClass({
    positionalParams: ['property', 'changeset']
});

export default ValidatedTextfield;
