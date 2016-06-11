import Ember from 'ember';
import {InvokeActionMixin} from 'ember-invoke-action';

const {Component, computed, observer, run} = Ember;
const {and} = computed;

export default Component.extend(InvokeActionMixin, {
    tagName: 'button',
    classNameBindings: ['buttonStyle'],
    buttonText: '',
    submitting: false,
    showSpinner: false,
    showSpinnerTimeout: null,
    autoWidth: true,
    state: false,

    // Disable Button when isLoading equals true
    attributeBindings: ['disabled', 'type', 'tabindex'],

    // Must be set on the controller
    disabled: and('showSpinner', 'submitting'),

    buttonStyle: computed('state', function () {
        if (this.get('state.resolved')) {
            return 'btn-green';
        } else if (this.get('state.rejected')) {
            return 'btn-red';
        }

        return '';
    }),

    click() {
        this.invokeAction('action');
    },

    toggleSpinner: observer('submitting', 'state', function () {
        let submitting = this.get('submitting');
        let state = this.get('state');
        let timeout = this.get('showSpinnerTimeout');

        if (submitting || state) {
            this.set('showSpinner', true);
            this.set('showSpinnerTimeout', run.later(this, function () {
                if (this.get('state')) {
                    this.set('state', false);
                }

                if (!this.get('submitting')) {
                    this.set('showSpinner', false);
                }
                this.set('showSpinnerTimeout', null);
            }, 1000));
        } else if (!submitting && !state && timeout === null) {
            this.set('showSpinner', false);
        }
    }),

    setSize: observer('showSpinner', function () {
        if (this.get('showSpinner') && this.get('autoWidth')) {
            this.$().width(this.$().width());
            this.$().height(this.$().height());
        } else {
            this.$().width('');
            this.$().height('');
        }
    }),

    willDestroy() {
        this._super(...arguments);
        run.cancel(this.get('showSpinnerTimeout'));
    }
});
