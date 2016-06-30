import Component from 'ember-component';
import computed, {equal} from 'ember-computed';
import run from 'ember-runloop';

import ShortcutsMixin from 'ghost-admin/mixins/shortcuts';
import imageManager from 'ghost-admin/utils/ed-image-manager';
import editorShortcuts from 'ghost-admin/utils/editor-shortcuts';
import {invokeAction} from 'ember-invoke-action';

export default Component.extend(ShortcutsMixin, {
    tagName: 'section',
    classNames: ['view-container', 'view-editor'],

    activeTab: 'markdown',
    editor: null,
    editorDisabled: undefined,
    editorScrollInfo: null, // updated when gh-ed-editor component scrolls
    height: null, // updated when markdown is rendered
    shouldFocusEditor: false,
    showCopyHTMLModal: false,
    copyHTMLModalContent: null,

    shortcuts: editorShortcuts,

    markdownActive: equal('activeTab', 'markdown'),
    previewActive: equal('activeTab', 'preview'),

    // HTML Preview listens to scrollPosition and updates its scrollTop value
    // This property receives scrollInfo from the textEditor, and height from the preview pane, and will update the
    // scrollPosition value such that when either scrolling or typing-at-the-end of the text editor the preview pane
    // stays in sync
    scrollPosition: computed('editorScrollInfo', 'height', function () {
        let scrollInfo = this.get('editorScrollInfo');
        let {$previewContent, $previewViewPort} = this;

        if (!scrollInfo || !$previewContent || !$previewViewPort) {
            return 0;
        }

        let previewHeight = $previewContent.height() - $previewViewPort.height();
        let previewPosition, ratio;

        ratio = previewHeight / scrollInfo.diff;
        previewPosition = scrollInfo.top * ratio;

        return previewPosition;
    }),

    didInsertElement() {
        this._super(...arguments);
        this.registerShortcuts();
        run.scheduleOnce('afterRender', this, this._cacheElements);
    },

    willDestroyElement() {
        invokeAction(this, 'onTeardown');

        this.removeShortcuts();
    },

    _cacheElements() {
        // cache these elements for use in other methods
        this.$previewViewPort = this.$('.js-entry-preview-content');
        this.$previewContent = this.$('.js-rendered-markdown');
    },

    actions: {
        selectTab(tab) {
            this.set('activeTab', tab);
        },

        updateScrollInfo(scrollInfo) {
            this.set('editorScrollInfo', scrollInfo);
        },

        updateHeight(height) {
            this.set('height', height);
        },

        // set from a `sendAction` on the gh-ed-editor component,
        // so that we get a reference for handling uploads.
        setEditor(editor) {
            this.set('editor', editor);
        },

        disableEditor() {
            this.set('editorDisabled', true);
        },

        enableEditor() {
            this.set('editorDisabled', undefined);
        },

        // The actual functionality is implemented in utils/ed-editor-shortcuts
        editorShortcut(options) {
            if (this.editor.$().is(':focus')) {
                this.editor.shortcut(options.type);
            }
        },

        // Match the uploaded file to a line in the editor, and update that line with a path reference
        // ensuring that everything ends up in the correct place and format.
        handleImgUpload(imageIndex, newSrc) {
            let editor = this.get('editor');
            let editorValue = editor.getValue();
            let replacement = imageManager.getSrcRange(editorValue, imageIndex);
            let cursorPosition;

            if (replacement) {
                cursorPosition = replacement.start + newSrc.length + 1;
                if (replacement.needsParens) {
                    newSrc = `(${newSrc})`;
                }
                editor.replaceSelection(newSrc, replacement.start, replacement.end, cursorPosition);
            }
        },

        toggleCopyHTMLModal(generatedHTML) {
            this.set('copyHTMLModalContent', generatedHTML);
            this.toggleProperty('showCopyHTMLModal');
        }
    }
});
