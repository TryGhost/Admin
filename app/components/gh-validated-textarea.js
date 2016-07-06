import Component from 'ember-component';
import {scheduleOnce} from 'ember-runloop';

import ChangesetValidationMixin from 'ghost-admin/mixins/changeset-validation';

const ValidatedTextarea = Component.extend(ChangesetValidationMixin, {
    classNames: 'form-group',
    classNameBindings: 'state',

    inputId: '',
    name: '',
    placeholder: '',
    label: '',
    helpText: '',
    disabled: false,

    didInsertElement() {
        this._super(...arguments);

        scheduleOnce('afterRender', () => {
            this.set('inputId', this.$('input').attr('id'));
        });
    }
});

ValidatedTextarea.reopenClass({
    positionalParams: ['property', 'changeset']
});

export default ValidatedTextarea;
