import Component from 'ember-component';
import ChangesetValidationMixin from 'ghost-admin/mixins/changeset-validation';

const ValidationContainer = Component.extend(ChangesetValidationMixin, {
    classNames: 'form-group',
    classNameBindings: 'state'
});

ValidationContainer.reopenClass({
    positionalParams: ['property', 'changeset']
});

export default ValidationContainer;
