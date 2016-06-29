import Mixin from 'ember-metal/mixin';
import run from 'ember-runloop';

export default Mixin.create({
    /**
     * Get Value
     *
     * Get the full contents of the textarea
     *
     * @returns {String}
     */
    getValue() {
        return this.readDOMAttr('value');
    },

    /**
     * Get Selection
     *
     * Return the currently selected text from the textarea
     *
     * @returns {Selection}
     */
    getSelection() {
        return this.$().getSelection();
    },

    /**
     * Get Line To Cursor
     *
     * Fetch the string of characters from the start of the given line up to the cursor
     * @returns {{text: string, start: number}}
     */
    getLineToCursor() {
        let selection = this.$().getSelection();
        let value = this.getValue();
        let lineStart;

        // Normalise newlines
        value = value.replace('\r\n', '\n');

        // We want to look at the characters behind the cursor
        lineStart = value.lastIndexOf('\n', selection.start - 1) + 1;

        return {
            text: value.substring(lineStart, selection.start),
            start: lineStart
        };
    },

    /**
     * Get Line
     *
     * Return the string of characters for the line the cursor is currently on
     *
     * @returns {{text: string, start: number, end: number}}
     */
    getLine() {
        let selection = this.$().getSelection();
        let value = this.getValue();
        let lineStart,
            lineEnd;

        // Normalise newlines
        value = value.replace('\r\n', '\n');

        // We want to look at the characters behind the cursor
        lineStart = value.lastIndexOf('\n', selection.start - 1) + 1;
        lineEnd = value.indexOf('\n', selection.start);
        lineEnd = lineEnd === -1 ? value.length - 1 : lineEnd;

        return {
            // jscs:disable
            text: value.substring(lineStart, lineEnd).replace(/^\n/, ''),
            // jscs:enable
            start: lineStart,
            end: lineEnd
        };
    },

    /**
     * Set Selection
     *
     * Set the section of text in the textarea that should be selected by the cursor
     *
     * @param {number} start
     * @param {number} end
     */
    setSelection(start, end) {
        let $textarea = this.$();

        if (start === 'end') {
            start = $textarea.val().length;
        }

        end = end || start;

        $textarea.setSelection(start, end);
    },

    /**
     * Replace Selection
     *
     * @param {String} replacement - the string to replace with
     * @param {number} replacementStart - where to start replacing
     * @param {number} [replacementEnd] - when to stop replacing, defaults to replacementStart
     * @param {String|boolean|Object} [cursorPosition]  - where to put the cursor after replacing
     *
     * Cursor position after replacement defaults to the end of the replacement.
     * Providing selectionStart only will cause the cursor to be placed there, or alternatively a range can be selected
     * by providing selectionEnd.
     */
    replaceSelection(replacement, replacementStart, replacementEnd, cursorPosition) {
        run.schedule('afterRender', this, function () {
            let $textarea = this.$();

            cursorPosition = cursorPosition || 'collapseToEnd';
            replacementEnd = replacementEnd || replacementStart;

            $textarea.setSelection(replacementStart, replacementEnd);

            if (['select', 'collapseToStart', 'collapseToEnd'].indexOf(cursorPosition) !== -1) {
                $textarea.replaceSelectedText(replacement, cursorPosition);
            } else {
                $textarea.replaceSelectedText(replacement);
                if (cursorPosition.hasOwnProperty('start')) {
                    $textarea.setSelection(cursorPosition.start, cursorPosition.end);
                } else {
                    $textarea.setSelection(cursorPosition, cursorPosition);
                }
            }

            $textarea.focus();
            // Tell the editor it has changed, as programmatic replacements won't trigger this automatically
            this._elementValueDidChange();
            this.sendAction('onChange');
        });
    }
});
