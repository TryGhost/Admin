import Component from '@ember/component';
import layout from '../templates/components/koenig-toolbar';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';
import {run} from '@ember/runloop';
import {task, timeout} from 'ember-concurrency';

// initially rendered offscreen with opacity 0 so that sizing is available
// shown when passed in an uncollapsed selected range
// display is delayed until the mouse button is lifted
// positioned so that it's always fully within the editor container
// animation occurs via CSS transitions
// position is kept after hiding, it's made inoperable by CSS pointer-events

// pixels that should be added to separate toolbar from positioning rect
export const TOOLBAR_MARGIN = 15;

// pixels that should be added to the `left` property of the tick adjustment styles
// TODO: handle via CSS?
const TICK_ADJUSTMENT = 8;

export default Component.extend({
    layout,

    attributeBindings: ['style'],
    classNames: ['absolute', 'z-999'],

    // public attrs
    editorRange: null,
    activeMarkupTagNames: null,
    activeSectionTagNames: null,

    // internal properties
    showToolbar: false,
    top: null,
    left: -1000,
    right: null,

    // private properties
    _isMouseDown: false,
    _hasSelectedRange: false,
    _onMousedownHandler: null,
    _onMousemoveHandler: null,
    _onMouseupHandler: null,
    _onResizeHandler: null,

    // closure actions
    toggleMarkup() {},
    toggleSection() {},
    editLink() {},

    /* computed properties -------------------------------------------------- */

    style: computed('showToolbar', 'top', 'left', 'right', function () {
        let position = this.getProperties('top', 'left', 'right');
        let styles = Object.keys(position).map((style) => {
            if (position[style] !== null) {
                return `${style}: ${position[style]}px`;
            }
        });

        // ensure hidden toolbar is non-interactive
        if (this.get('showToolbar')) {
            styles.push('pointer-events: auto !important');
        } else {
            styles.push('pointer-events: none !important');
        }

        return htmlSafe(styles.compact().join('; '));
    }),

    /* lifecycle hooks ------------------------------------------------------ */

    init() {
        this._super(...arguments);

        // track mousedown/mouseup on the window so that we're sure to get the
        // events even when they start outside of this component or end outside
        // the window
        this._onMousedownHandler = run.bind(this, this._handleMousedown);
        window.addEventListener('mousedown', this._onMousedownHandler);
        this._onMouseupHandler = run.bind(this, this._handleMouseup);
        window.addEventListener('mouseup', this._onMouseupHandler);
        this._onResizeHandler = run.bind(this, this._handleResize);
        window.addEventListener('resize', this._onResizeHandler);
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
        this._removeStyleElement();
        run.cancel(this._throttleResize);
        window.removeEventListener('mousedown', this._onMousedownHandler);
        window.removeEventListener('mousemove', this._onMousemoveHandler);
        window.removeEventListener('mouseup', this._onMouseupHandler);
        window.removeEventListener('resize', this._onResizeHandler);
    },

    actions: {
        toggleMarkup(markupName) {
            if (markupName === 'em' && this.get('activeMarkupTagNames.isI')) {
                markupName = 'i';
            }

            this.toggleMarkup(markupName);
        },

        toggleSection(sectionName) {
            this.toggleSection(sectionName);
        },

        editLink() {
            this.editLink(this.get('editorRange'));
        }
    },

    /* private methods ------------------------------------------------------ */

    _toggleVisibility: task(function* (skipMousemove = false) {
        // debounce for 50ms to account for "click to deselect" otherwise we
        // run twice and the fade out animation jumps position
        yield timeout(50);

        // return early if the editorRange hasn't changed, this prevents
        // re-rendering unnecessarily which can cause minor position jumps when
        // styles are toggled because getBoundingClientRect on getSelection
        // changes slightly depending on the style of selected text
        if (this.get('editorRange') === this._lastRange) {
            return;
        }

        // if we have a range, show the toolbnar once the mouse is lifted
        if (this._hasSelectedRange && !this._isMouseDown) {
            this._showToolbar(skipMousemove);
        } else {
            this._hideToolbar();
        }
    }).restartable(),

    _handleMousedown(event) {
        // we only care about the left mouse button
        if (event.which === 1) {
            this._isMouseDown = true;
        }
    },

    _handleMousemove() {
        if (!this.get('showToolbar')) {
            this.set('showToolbar', true);
        }

        this._removeMousemoveHandler();
    },

    _removeMousemoveHandler() {
        window.removeEventListener('mousemove', this._onMousemoveHandler);
        this._onMousemoveHandler = null;
    },

    _handleMouseup(event) {
        if (event.which === 1) {
            this._isMouseDown = false;
            // we want to skip the mousemove handler here because we know the
            // selection (if there was one) was via the mouse and we don't want
            // to wait for another mousemove before showing the toolbar
            this.get('_toggleVisibility').perform(true);
        }
    },

    _handleResize() {
        if (this.get('showToolbar')) {
            this._throttleResize = run.throttle(this, this._positionToolbar, 100);
        }
    },

    _showToolbar(skipMousemove) {
        this._positionToolbar();

        if (skipMousemove) {
            this.set('showToolbar', true);
        }

        if (!this.get('showToolbar') && !this._onMousemoveHandler) {
            this._onMousemoveHandler = run.bind(this, this._handleMousemove);
            window.addEventListener('mousemove', this._onMousemoveHandler);
        }

        // track displayed range so that we don't re-position unnecessarily
        this._lastRange = this.get('editorRange');
    },

    _hideToolbar() {
        this.set('showToolbar', false);
        this._lastRange = null;
        this._removeMousemoveHandler();
    },

    _positionToolbar() {
        let containerRect = this.element.parentNode.getBoundingClientRect();
        let range = window.getSelection().getRangeAt(0);
        let rangeRect = range.getBoundingClientRect();
        let {width, height} = this.element.getBoundingClientRect();
        let newPosition = {};

        // rangeRect is relative to the viewport so we need to subtract the
        // container measurements to get a position relative to the container
        newPosition = {
            top: rangeRect.top - containerRect.top - height - TOOLBAR_MARGIN,
            left: rangeRect.left - containerRect.left + rangeRect.width / 2 - width / 2,
            right: null
        };

        let tickPosition = 50;
        // don't overflow left boundary
        if (newPosition.left < 0) {
            newPosition.left = 0;

            // calculate the tick percentage position
            let absTickPosition = rangeRect.left - containerRect.left + rangeRect.width / 2;
            tickPosition = absTickPosition / width * 100;
            if (tickPosition < 5) {
                tickPosition = 5;
            }
        }
        // same for right boundary
        if (newPosition.left + width > containerRect.width) {
            newPosition.left = null;
            newPosition.right = 0;

            // calculate the tick percentage position
            let absTickPosition = rangeRect.right - containerRect.right - rangeRect.width / 2;
            tickPosition = 100 + absTickPosition / width * 100;
            if (tickPosition > 95) {
                tickPosition = 95;
            }
        }

        // the tick is a pseudo-element so we the only way we can affect it's
        // style is by adding a style element to the head
        this._removeStyleElement(); // reset to base styles
        if (tickPosition !== 50) {
            this._addStyleElement(`left: calc(${tickPosition}% - ${TICK_ADJUSTMENT}px)`);
        }

        // update the toolbar position
        this.setProperties(newPosition);
    },

    _addStyleElement(styles) {
        let styleElement = document.createElement('style');
        styleElement.id = `${this.elementId}-style`;
        styleElement.innerHTML = `#${this.elementId} > ul:after { ${styles} }`;
        document.head.appendChild(styleElement);
    },

    _removeStyleElement() {
        let styleElement = document.querySelector(`#${this.elementId}-style`);
        if (styleElement) {
            styleElement.remove();
        }
    }
});
