import Mixin from 'ember-metal/mixin';
import Ember from 'ember';
import computed, {reads, and, not} from 'ember-computed';
import {isEmberArray} from 'ember-array/utils';
import {isBlank} from 'ember-utils';

import {invokeAction} from 'ember-invoke-action';

// ember-cli-shims exports the wrong defineProperty
const {defineProperty} = Ember;

export default Mixin.create({
    // passed-in properties
    property: '',
    changeset: null,
    validateOnBlank: true,

    didReceiveAttrs() {
        this._super(...arguments);

        let property = this.get('property');

        defineProperty(this, 'value', reads(`changeset.${property}`));

        defineProperty(this, 'didValidate', computed('changeset.hasValidated.[]', function () {
            return this.get('changeset.hasValidated').contains(property);
        }));

        // always returns a single error
        defineProperty(this, 'error', computed(`changeset.error.${property}.{value,validation}`, function () {
            let errors = this.get(`changeset.error.${property}.validation`);

            // return the 1st error if array because they're ordered by importance
            if (isEmberArray(errors)) {
                return errors[0];
            }

            return errors;
        }).readOnly());
    },

    isValid: and('doesNotHaveError', 'changeset.isDirty', 'didValidate'),
    isInvalid: reads('changeset.isInvalid'),
    hasError: and('didValidate', 'isInvalid', 'error'),
    doesNotHaveError: not('hasError'),

    state: computed('isValid', 'hasError', 'didValidate', function () {
        if (!this.get('didValidate')) {
            return '';
        }

        if (this.get('hasError')) {
            return 'error';
        }

        if (this.get('isValid')) {
            return 'success';
        }
    }),

    actions: {
        update(value) {
            let property = this.get('property');
            let changeset = this.get('changeset');

            changeset.set(property, value);
            changeset.clear(property); // clear hasValidated
        },

        focusOut() {
            let property = this.get('property');
            let validateOnBlank = this.get('validateOnBlank');

            if (validateOnBlank || !isBlank(this.get('value'))) {
                return this.get('changeset').validate(property).then(() => {
                    invokeAction(this, 'focusOut');
                });
            }

            return invokeAction(this, 'focusOut');
        }
    }
});
