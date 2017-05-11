import Component from 'ember-component';
import computed from 'ember-computed';
import {assign} from 'ember-platform';
import {copy} from 'ember-metal/utils';
import {isEmpty} from 'ember-utils';
import run from 'ember-runloop';
import formatMarkdown from 'ghost-admin/utils/format-markdown';

const MOBILEDOC_VERSION = '0.3.1';

export const BLANK_DOC = {
    version: MOBILEDOC_VERSION,
    markups: [],
    atoms: [],
    cards: [
        ['card-markdown', {
            cardName: 'card-markdown',
            markdown: ''
        }]
    ],
    sections: [[10, 0]]
};

export default Component.extend({

    classNames: ['gh-markdown-editor'],
    classNameBindings: [
        '_isFullScreen:gh-markdown-editor-full-screen',
        '_isSplitScreen:gh-markdown-editor-side-by-side'
    ],

    // Public attributes
    autofocus: false,
    imageMimeTypes: null,
    isFullScreen: false,
    mobiledoc: null,
    options: null,
    placeholder: '',
    uploadedImageUrls: null,

    // Closure actions
    onChange() {},
    onFullScreen() {},
    onImageFilesSelected() {},
    onSplitScreen() {},
    showMarkdownHelp() {},

    // Internal attributes
    markdown: null,

    // Private
    _editor: null,
    _isFullScreen: false,
    _isSplitScreen: false,
    _isUploading: false,
    _statusbar: null,
    _toolbar: null,
    _uploadedImageUrls: null,

    simpleMDEOptions: computed('options', function () {
        let options = this.get('options') || {};
        let defaultOptions = {
            // use our Showdown config with sanitization for previews
            previewRender(markdown) {
                return formatMarkdown(markdown);
            },

            // Ghost-specific SimpleMDE toolbar config - allows us to create a
            // bridge between SimpleMDE buttons and Ember actions
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link',
                {
                    name: 'image',
                    action: () => {
                        this._openImageFileDialog();
                    },
                    className: 'fa fa-picture-o',
                    title: 'Upload Image(s)'
                },
                '|',
                'preview',
                {
                    name: 'side-by-side',
                    action: () => {
                        this.send('toggleSplitScreen');
                    },
                    className: 'fa fa-columns no-disable no-mobile',
                    title: 'Toggle Side by Side'
                },
                {
                    name: 'fullscreen',
                    action: () => {
                        this.send('toggleFullScreen');
                    },
                    className: 'fa fa-arrows-alt no-disable no-mobile',
                    title: 'Toggle Fullscreen'
                },
                '|',
                {
                    name: 'guide',
                    action: () => {
                        this.showMarkdownHelp();
                    },
                    className: 'fa fa-question-circle',
                    title: 'Markdown Guide'
                }
            ],

            // disable shortcuts for side-by-side and fullscreen because they
            // trigger interal SimpleMDE methods that will result in broken
            // layouts
            shortcuts: {
                toggleSideBySide: null,
                toggleFullScreen: null
            },

            // only include the number of words in the status bar
            status: ['words']
        };

        return assign(defaultOptions, options);
    }),

    // extract markdown content from single markdown card
    didReceiveAttrs() {
        this._super(...arguments);
        let mobiledoc = this.get('mobiledoc') || copy(BLANK_DOC, true);

        let uploadedImageUrls = this.get('uploadedImageUrls');
        if (!isEmpty(uploadedImageUrls) && uploadedImageUrls !== this._uploadedImageUrls) {
            this._uploadedImageUrls = uploadedImageUrls;

            // must be done afterRender to avoid double modify of mobiledoc in
            // a single render
            run.scheduleOnce('afterRender', this, () => {
                this._insertImages(uploadedImageUrls);
                // reset the file input so the same file can be selected again
                this.$('input[type=file]').val('');
            });
        }

        // eslint-disable-next-line ember-suave/prefer-destructuring
        let markdown = mobiledoc.cards[0][1].markdown;
        this.set('markdown', markdown);

        // use internal values to avoid updating bound values
        if (!isEmpty(this.get('isFullScreen'))) {
            this.set('_isFullScreen', this.get('isFullScreen'));
        }
        if (!isEmpty(this.get('isSplitScreen'))) {
            this.set('_isSplitScreen', this.get('isSplitScreen'));
        }

        this._updateButtonState();
    },

    _insertImages(urls) {
        let cm = this._editor.codemirror;

        // loop through urls and generate image markdown
        let images = urls.map((url) => {
            return `![](${url})`;
        });
        let text = images.join(' ');

        // clicking the image toolbar button will lose the selection so we use
        // the captured selection to re-select here
        if (this._imageInsertSelection) {
            // we want to focus but not re-position
            this.send('focusEditor', null);

            // re-select and clear the captured selection so drag/drop still
            // inserts at the correct place
            cm.setSelection(
                this._imageInsertSelection.anchor,
                this._imageInsertSelection.head
            );
            this._imageInsertSelection = null;
        }

        // focus editor and place cursor at end if not already focused
        if (!cm.hasFocus()) {
            this.send('focusEditor');
        }

        // insert at cursor or replace selection then position cursor at end
        // of inserted text
        cm.replaceSelection(text, 'end');
    },

    // mark the split-pane/full-screen buttons active when they're active
    _updateButtonState() {
        if (this._editor) {
            let fullScreenButton = this._editor.toolbarElements.fullscreen;
            let sideBySideButton = this._editor.toolbarElements['side-by-side'];

            if (this.get('_isFullScreen')) {
                fullScreenButton.classList.add('active');
            } else {
                fullScreenButton.classList.remove('active');
            }

            if (this.get('_isSplitScreen')) {
                sideBySideButton.classList.add('active');
            } else {
                sideBySideButton.classList.remove('active');
            }
        }
    },

    // set up the preview auto-update and scroll sync
    _connectSplitPreview() {
        let cm = this._editor.codemirror;
        let editor = this._editor;
        /* eslint-disable ember-suave/prefer-destructuring */
        let editorPane = this.$('.gh-markdown-editor-pane')[0];
        let previewPane = this.$('.gh-markdown-editor-preview')[0];
        let previewContent = this.$('.gh-markdown-editor-preview-content')[0];
        /* eslint-enable ember-suave/prefer-destructuring */

        this._editorPane = editorPane;
        this._previewPane = previewPane;
        this._previewContent = previewContent;

        // from SimpleMDE -------
        let sideBySideRenderingFunction = function() {
            previewContent.innerHTML = editor.options.previewRender(
                editor.value(),
                previewContent
            );
        };

        cm.sideBySideRenderingFunction = sideBySideRenderingFunction;

        sideBySideRenderingFunction();
        cm.on('update', cm.sideBySideRenderingFunction);

        // Refresh to fix selection being off (#309)
        cm.refresh();
        // ----------------------

        this._onEditorPaneScroll = this._scrollHandler.bind(this);
        editorPane.addEventListener('scroll', this._onEditorPaneScroll, false);
        this._scrollSync();
    },

    _scrollHandler() {
        if (!this._scrollSyncTicking) {
            requestAnimationFrame(this._scrollSync.bind(this));
        }
        this._scrollSyncTicking = true;
    },

    _scrollSync() {
        let editorPane = this._editorPane;
        let previewPane = this._previewPane;
        let height = editorPane.scrollHeight - editorPane.clientHeight;
        let ratio = parseFloat(editorPane.scrollTop) / height;
        let move = (previewPane.scrollHeight - previewPane.clientHeight) * ratio;

        previewPane.scrollTop = move;
        this._scrollSyncTicking = false;
    },

    _disconnectSplitPreview() {
        let cm = this._editor.codemirror;

        cm.off('update', cm.sideBySideRenderingFunction);
        cm.refresh();

        this._editorPane.removeEventListener('scroll', this._onEditorPaneScroll, false);
        delete this._previewPane;
        delete this._previewPaneContent;
        delete this._onEditorPaneScroll;
    },

    _openImageFileDialog() {
        // capture the current selection before it's lost by clicking the
        // file input button
        this._imageInsertSelection = {
            anchor: this._editor.codemirror.getCursor('anchor'),
            head: this._editor.codemirror.getCursor('head')
        };

        // trigger the dialog via gh-file-input, when a file is selected it will
        // trigger the onImageFilesSelected closure action
        this.$('input[type="file"]').click();
    },

    willDestroyElement() {
        if (this.get('_isSplitScreen')) {
            this._disconnectSplitPreview();
        }

        this._super(...arguments);
    },

    actions: {
        // put the markdown into a new mobiledoc card, trigger external update
        updateMarkdown(markdown) {
            let mobiledoc = copy(BLANK_DOC, true);
            mobiledoc.cards[0][1].markdown = markdown;
            this.onChange(mobiledoc);
        },

        // store a reference to the simplemde editor so that we can handle
        // focusing and image uploads
        setEditor(editor) {
            this._editor = editor;

            // disable CodeMirror's drag/drop handling as we want to handle that
            // in the parent gh-editor component
            this._editor.codemirror.setOption('dragDrop', false);

            // HACK: move the toolbar & status bar elements outside of the
            // editor container so that they can be aligned in fixed positions
            let container = this.$().closest('.gh-editor').find('.gh-editor-footer');
            this._toolbar = this.$('.editor-toolbar');
            this._statusbar = this.$('.editor-statusbar');
            this._toolbar.appendTo(container);
            this._statusbar.appendTo(container);

            this._updateButtonState();
        },

        // used by the title input when the TAB or ENTER keys are pressed
        focusEditor(position = 'bottom') {
            this._editor.codemirror.focus();

            if (position === 'bottom') {
                this._editor.codemirror.execCommand('goDocEnd');
            } else if (position === 'top') {
                this._editor.codemirror.execCommand('goDocStart');
            }

            return false;
        },

        toggleFullScreen() {
            let isFullScreen = !this.get('_isFullScreen');

            this.set('_isFullScreen', isFullScreen);
            this._updateButtonState();
            this.onFullScreen(isFullScreen);

            // leave split screen when exiting full screen mode
            if (!isFullScreen && this.get('_isSplitScreen')) {
                this.send('toggleSplitScreen');
            }
        },

        toggleSplitScreen() {
            let isSplitScreen = !this.get('_isSplitScreen');
            let previewButton = this._editor.toolbarElements.preview;

            this.set('_isSplitScreen', isSplitScreen);
            this._updateButtonState();

            // set up the preview rendering and scroll sync
            // afterRender is needed so that necessary components have been
            // added/removed and editor pane length has settled
            if (isSplitScreen) {
                // disable the normal SimpleMDE preview if it's active
                if (this._editor.isPreviewActive()) {
                    let preview = this._editor.toolbar.find((button) => {
                        return button.name === 'preview';
                    });

                    preview.action(this._editor);
                }

                previewButton.classList.add('disabled');
                run.scheduleOnce('afterRender', this, this._connectSplitPreview);
            } else {
                previewButton.classList.remove('disabled');
                run.scheduleOnce('afterRender', this, this._disconnectSplitPreview);
            }

            this.onSplitScreen(isSplitScreen);

            // go fullscreen when entering split screen mode
            if (isSplitScreen && !this.get('_isFullScreen')) {
                this.send('toggleFullScreen');
            }
        },

        // put the toolbar/statusbar elements back so that SimpleMDE doesn't throw
        // errors when it tries to remove them
        destroyEditor() {
            let container = this.$('.gh-markdown-editor-pane');
            this._toolbar.appendTo(container);
            this._statusbar.appendTo(container);
            this._editor = null;
        }
    }
});
