import Component from '@ember/component';
import ValidationState from 'ghost-admin/mixins/validation-state';
import {computed} from '@ember/object';
import {readOnly} from '@ember/object/computed';
import {run} from '@ember/runloop';

export default Component.extend(ValidationState, {
    classNames: 'gh-customfield-item',
    classNameBindings: ['errorClass', 'customFieldItem.isNew'],

    new: false,

    fieldTypes: readOnly('customFieldItem.fieldTypes'),
    errors: readOnly('customFieldItem.errors'),

    errorClass: computed('hasError', function () {
        if (this.get('hasError')) {
            return 'gh-customfield-item--error';
        }
    }),

    actions: {
        addItem() {
            let action = this.get('addItem');
            if (action) {
                action();
            }
        },

        deleteItem(item) {
            let action = this.get('deleteItem');
            if (action) {
                action(item);
            }
        },

        updateName(value) {
            let action = this.get('updateName');
            if (action) {
                action(value, this.get('customFieldItem'));
            }
        },

        updateType(value) {
            this.get('customFieldItem.errors').remove('type');

            let action = this.get('updateType');
            if (action) {
                action(value, this.get('customFieldItem'));
            }
        },

        clearNameErrors() {
            this.get('customFieldItem.errors').remove('name');
        }
    },

    keyPress(event) {
        // enter key
        if (event.keyCode === 13 && this.get('customFieldItem.isNew')) {
            event.preventDefault();
            run.scheduleOnce('actions', this, function () {
                this.send('addItem');
            });
        }
    }
});
