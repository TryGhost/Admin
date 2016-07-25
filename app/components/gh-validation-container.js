import Component from 'ember-component';
import ChangesetValidationMixin from 'ghost-admin/mixins/changeset-validation';

const ValidationContainer = Component.extend(ChangesetValidationMixin, {
    classNameBindings: ['state', 'formGroup'],

    formGroup: true
});

ValidationContainer.reopenClass({
    positionalParams: ['property', 'changeset']
});

export default ValidationContainer;
