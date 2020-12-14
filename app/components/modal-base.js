/* global key */
import Component from '@ember/component';
import {run} from '@ember/runloop';

export default Component.extend({
    tagName: 'section',
    classNames: 'modal-content',

    _previousKeymasterScope: null,

    // Allowed Actions
    closeModal: () => {},

    didInsertElement() {
        this._super(...arguments);
        this._setupShortcuts();
    },

    willDestroyElement() {
        this._super(...arguments);
        this._removeShortcuts();
    },

    actions: {
        confirm() {
            throw new Error('You must override the "confirm" action in your modal component');
        },

        closeModal() {
            this.closeModal();
        }
    },

    _setupShortcuts() {
        run(function () {
            document.activeElement.blur();
        });

        this._previousKeymasterScope = key.getScope();

        key('escape', 'modal', () => {
            this.send('closeModal');
        });

        key.setScope('modal');
    },

    _removeShortcuts() {
        key.unbind('escape', 'modal');
        key.setScope(this._previousKeymasterScope);
    }
});
