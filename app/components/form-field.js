import Ember from 'ember';
import FormField from 'ember-form-for/components/form-field';

const {get, getWithDefault, set} = Ember;

export default FormField.extend({
    updateOnFocusOut: true,

    _processUpdate(object, propertyName, value) {
        let rawValue = get(this, 'rawValue');
        let deserializeValue = getWithDefault(this, 'deserializeValue', (value) => value);
        get(this, 'update')(object, propertyName, deserializeValue(value, rawValue));
    },

    didInsertElement() {
        this._super(...arguments);

        // checkboxes don't work with `rawValue` in Safari/Firefox and shouldn't
        // have on-focus-out validation attached to them anyway
        if (get(this, 'control') === 'one-way-checkbox') {
            set(this, 'updateOnFocusOut', false);
        }
    },

    actions: {
        processUpdate(object, propertyName, value) {
            if (!get(this, 'updateOnFocusOut')) {
                this._processUpdate(object, propertyName, value);
            } else {
                set(this, 'value', value);
            }
        },

        processFocusOut(object, propertyName, value) {
            if (get(this, 'updateOnFocusOut')) {
                this._processUpdate(object, propertyName, value);
            }
        }
    }
});
