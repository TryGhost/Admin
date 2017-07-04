/* global device */
import Mixin from 'ember-metal/mixin';
import computed from 'ember-computed';

export default Mixin.create({
    attributeBindings: ['autofocus'],

    selectOnClick: false,
    shouldFocus: false,
    stopEnterKeyDownPropagation: false,

    autofocus: computed(function () {
        if (this.get('shouldFocus')) {
            return (device.ios()) ? false : 'autofocus';
        }

        return false;
    }),

    didInsertElement() {
        this._super(...arguments);
        this._focus();
    },

    click(event) {
        if (this.get('selectOnClick')) {
            event.currentTarget.select();
        }
    },

    keyDown(event) {
        // stop event propagation when pressing "enter"
        // most useful in the case when undesired (global) keyboard shortcuts
        // are getting triggered while interacting with this particular input element.
        if (this.get('stopEnterKeyDownPropagation') && event.keyCode === 13) {
            event.stopPropagation();

            return true;
        }

        // prevent default TAB behaviour if we have a keyEvent for it
        if (event.keyCode === 9 && this.get('keyEvents.9')) {
            event.preventDefault();
        }

        this._super(...arguments);
    },

    _focus() {
        // Until mobile safari has better support
        // for focusing, we just ignore it
        if (this.get('shouldFocus') && !device.ios()) {
            this.element.focus();
        }
    }
});
