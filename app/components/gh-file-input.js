import XFileInput from 'emberx-file-input/components/x-file-input';

// TODO: remove this override and use {{x-file-input}} directly once we've
// upgraded to emberx-file-input@1.2.0

export default XFileInput.extend({
    didInsertElement() {
        this.onInsert?.(this.element.querySelector('input[type="file"]'));
    },

    change(e) {
        let action = this.action;
        let files = this.files(e);

        if (files.length && action) {
            action(files, this.resetInput.bind(this));
        }
    },

    /**
    * Gets files from event object.
    *
    * @method
    * @private
    * @param {$.Event || Event}
    */
    files(e) {
        return (e.originalEvent || e).testingFiles || e.target.files;
    },

    /**
    * Resets the value of the input so you can select the same file
    * multiple times.
    *
    * NOTE: fixes reset in Firefox which doesn't reset like other browsers
    * when doing input.value = null;
    *
    * @method
    */
    resetInput() {
        let input = this.element.querySelector('.x-file--input');
        input.removeAttribute('value');
        input.value = null;
        input.parentNode.replaceChild(input.cloneNode(true), input);
    }
});
