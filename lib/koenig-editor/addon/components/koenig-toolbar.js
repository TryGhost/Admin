import Component from '@ember/component';
import layout from '../templates/components/koenig-toolbar';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';
import {task, timeout} from 'ember-concurrency';

// rendered off-screen so that we can get measurements
// positioned when needed and classes added to animate in
// animate-out class applied when selection is removed
// watch for animationend event to fire then move offscreen again

const TOOLBAR_TOP_MARGIN = 15;

export default Component.extend({
    layout,

    attributeBindings: ['style'],

    // public attrs
    classNames: ['koenig-toolbar'],
    classNameBindings: ['showToolbar:koenig-toolbar--visible'],
    selectedRange: null,

    // internal properties
    showToolbar: false,
    top: null,
    left: null,
    right: null,

    // private properties
    _isMouseDown: false,
    _onMousedownHandler: false,
    _onMouseupHandler: false,
    _hasSelectedRange: false,

    /* computed properties -------------------------------------------------- */

    style: computed('top', 'left', 'right', function () {
        let position = this.getProperties('top', 'left', 'right');
        let styles = Object.keys(position).map((style) => {
            if (position[style] !== null) {
                return `${style}: ${position[style]}px`;
            }
        });

        return htmlSafe(styles.compact().join('; '));
    }),

    /* lifecycle hooks ------------------------------------------------------ */

    init() {
        this._super(...arguments);

        // track mousedown/mouseup on the window so that we're sure to get the
        // events even when they start outside of this component or end outside
        // the window
        this._onMousedownHandler = (event) => {
            // we only care about the left mouse button
            if (event.which === 1) {
                this._isMouseDown = true;
            }
        };
        this._onMouseupHandler = (event) => {
            if (event.which === 1) {
                this._isMouseDown = false;
                this.get('_toggleVisibility').perform();
            }
        };
        window.addEventListener('mousedown', this._onMousedownHandler);
        window.addEventListener('mouseup', this._onMouseupHandler);
    },

    didReceiveAttrs() {
        this._super(...arguments);
        let range = this.get('editorRange');

        if (range && !range.isCollapsed) {
            this._hasSelectedRange = true;
        } else {
            this._hasSelectedRange = false;
        }

        this.get('_toggleVisibility').perform();
    },

    willDestroyElement() {
        this._super(...arguments);
        window.removeEventListener('mousedown', this._onMousedownHandler);
        window.removeEventListener('mouseup', this._onMouseupHandler);
    },

    _toggleVisibility: task(function* () {
        // debounce for 100ms to account for "click to deselect" otherwise we
        // run twice and the fade out animation jumps position
        yield timeout(100);

        if (this._hasSelectedRange && !this._isMouseDown) {
            let containerRect = this.element.parentNode.getBoundingClientRect();
            let range = window.getSelection().getRangeAt(0);
            let rangeRect = range.getBoundingClientRect();
            let {width, height} = this.element.getBoundingClientRect();

            // rangeRect is relative tot the viewport so we need to subtract the
            // container measurements to get a position relative to the container
            this.setProperties({
                top: rangeRect.top - containerRect.top - height - TOOLBAR_TOP_MARGIN,
                left: rangeRect.left - containerRect.left + rangeRect.width / 2 - width / 2
            });

            this.set('showToolbar', true);
        } else {
            this.set('showToolbar', false);
        }
    }).restartable()
});
