import Component from '@ember/component';

export default Component.extend({

    // public attrs
    tagName: '',
    title: '',
    titlePlaceholder: '',
    body: null,
    bodyPlaceholder: '',
    bodyAutofocus: false,

    // internal properties
    _title: null,
    _editor: null,

    // closure actions
    onTitleChange() {},
    onTitleBlur() {},
    onBodyChange() {},

    actions: {
        focusEditor(event) {
            if (event.target.tagName === 'ARTICLE' && event.target.classList.contains('koenig-editor')) {
                event.preventDefault();
                this._editor.focus();
            }
        },

        /* title related actions -------------------------------------------- */

        onTitleCreated(titleElement) {
            this._title = titleElement;
        },

        onTitleChange(newTitle) {
            this.onTitleChange(newTitle);
        },

        onTitleFocusOut() {
            this.onTitleBlur();
        },

        onTitleKeydown(event) {
            // TODO: handle ENTER and DOWN keys
            console.log('onTitleKeydown', event);
        },

        /* body related actions --------------------------------------------- */

        onEditorCreated(editor) {
            this._setupEditor(editor);
        },

        onBodyChange(newMobiledoc) {
            this.onBodyChange(newMobiledoc);
        }
    },

    /* public methods ------------------------------------------------------- */

    /* internal methods ----------------------------------------------------- */

    _setupEditor(editor) {
        // TODO: add handling for UP key so that the title can be focused
        this._editor = editor;
    }
});
