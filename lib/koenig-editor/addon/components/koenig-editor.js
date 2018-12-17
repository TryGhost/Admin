/*
 * Based on ember-mobiledoc-editor
 * https://github.com/bustle/ember-mobiledoc-editor
 */

import Component from '@ember/component';
import Editor from 'mobiledoc-kit/editor/editor';
import EmberObject, {computed, get} from '@ember/object';
import Key from 'mobiledoc-kit/utils/key';
import MobiledocRange from 'mobiledoc-kit/utils/cursor/range';
import calculateReadingTime from '../utils/reading-time';
import countWords from '../utils/count-words';
import defaultAtoms from '../options/atoms';
import defaultCards, {CARD_COMPONENT_MAP, CARD_ICON_MAP} from '../options/cards';
import formatMarkdown from 'ghost-admin/utils/format-markdown';
import layout from '../templates/components/koenig-editor';
import parserPlugins from '../options/parser-plugins';
import registerKeyCommands from '../options/key-commands';
import registerTextExpansions from '../options/text-expansions';
import validator from 'npm:validator';
import {A} from '@ember/array';
import {MOBILEDOC_VERSION} from 'mobiledoc-kit/renderers/mobiledoc';
import {assign} from '@ember/polyfills';
import {camelize, capitalize} from '@ember/string';
import {copy} from '@ember/object/internals';
import {getContentFromPasteEvent} from 'mobiledoc-kit/utils/parse-utils';
import {getLinkMarkupFromRange} from '../utils/markup-utils';
import {getOwner} from '@ember/application';
import {getParent} from '../lib/dnd/utils';
import {guidFor} from '@ember/object/internals';
import {isBlank} from '@ember/utils';
import {run} from '@ember/runloop';
import {inject as service} from '@ember/service';
import {svgJar} from 'ghost-admin/helpers/svg-jar';

const UNDO_DEPTH = 100;

export const ADD_CARD_HOOK = 'addComponent';
export const REMOVE_CARD_HOOK = 'removeComponent';

// used in test helpers to grab a reference to the underlying mobiledoc editor
export const TESTING_EXPANDO_PROPERTY = '__mobiledoc_kit_editor';

// blank doc contains a single empty paragraph so that there's some content for
// the cursor to start in
export const BLANK_DOC = {
    version: MOBILEDOC_VERSION,
    markups: [],
    atoms: [],
    cards: [],
    sections: [
        [1, 'p', [
            [0, [], 0, '']
        ]]
    ]
};

export const CURSOR_BEFORE = -1;
export const CURSOR_AFTER = 1;
export const NO_CURSOR_MOVEMENT = 0;

// markups that should not be continued when typing and reverted to their
// text expansion style when backspacing over final char of markup
export const SPECIAL_MARKUPS = {
    S: '~~',
    CODE: '`',
    SUP: '^',
    SUB: '~'
};

export function arrayToMap(array) {
    let map = Object.create(null);
    array.forEach((key) => {
        if (key) { // skip undefined/falsy key values
            key = `is${capitalize(camelize(key))}`;
            map[key] = true;
        }
    });
    return map;
}

// if the cursor is at the end of one of our "special" markups that can only be
// toggled via markdown expansions then we want to ensure that the markup is
// removed from the edit state so that you can type without being stuck with
// the special formatting
export function toggleSpecialFormatEditState(editor) {
    let {head, isCollapsed} = editor.range;
    if (isCollapsed) {
        Object.keys(SPECIAL_MARKUPS).forEach((tagName) => {
            tagName = tagName.toLowerCase();
            if (head.marker && head.marker.hasMarkup(tagName) && editor._editState.activeMarkups.findBy('tagName', tagName)) {
                let nextMarker = head.markerIn(1);
                if (!nextMarker || !nextMarker.hasMarkup(tagName)) {
                    // there is a bug somehwhere that means after pasting
                    // content the _editState can end up with multiple
                    // instances of the markup so we need to toggle all of them
                    editor._editState.activeMarkups.filterBy('tagName', tagName).forEach((markup) => {
                        editor._editState.toggleMarkupState(markup);
                    });
                }
            }
        });
    }
}

// helper function to insert image cards at or after the current active section
// used when pasting or dropping image files
function insertImageCards(files, postEditor) {
    let {builder, editor} = postEditor;
    let collection = editor.post.sections;
    let section = editor.activeSection;

    // when dropping an image on the editor before it's had focus there will be
    // no active section so we insert the image at the end of the document
    if (!section) {
        section = editor.post.sections.tail;

        // create a blank paragraph at the end of the document if needed because
        // we use `insertSectionBefore` and don't want the image to be added
        // before the last card
        if (!section.isMarkerable) {
            let blank = builder.createMarkupSection();
            postEditor.insertSectionAtEnd(blank);
            postEditor.setRange(blank.toRange());
            section = postEditor._range.head.section;
        }
    }

    // place the card after the active section
    if (!section.isBlank && !section.isListItem && section.next) {
        section = section.next;
    }

    // list items cannot contain card sections so insert a blank paragraph after
    // the whole list ready to be replaced by the image cards
    if (section.isListItem) {
        let list = section.parent;
        let blank = builder.createMarkupSection();
        if (list.next) {
            postEditor.insertSectionBefore(collection, blank, list.next);
        } else {
            postEditor.insertSectionAtEnd(blank);
        }
        postEditor.setRange(blank.toRange());
        section = postEditor._range.head.section;
    }

    // insert an image card for each image, keep track of the last card to be
    // inserted so that the cursor can be placed on it at the end
    let lastImageSection;
    files.forEach((file) => {
        let payload = {
            files: [file]
        };
        lastImageSection = builder.createCardSection('image', payload);
        postEditor.insertSectionBefore(collection, lastImageSection, section);
    });

    // remove the current section if it's blank - avoids unexpected blank
    // paragraph after the insert is complete
    if (section.isBlank) {
        postEditor.removeSection(section);
    }

    // place cursor on the last inserted image
    postEditor.setRange(lastImageSection.tailPosition());
}

export default Component.extend({
    koenigDragDropHandler: service(),

    layout,
    tagName: 'article',
    classNames: ['koenig-editor', 'w-100', 'flex-grow', 'relative', 'center', 'mb0', 'mt0'],

    // public attrs
    mobiledoc: null,
    placeholder: 'Write here...',
    autofocus: false,
    spellcheck: true,
    options: null,
    headerOffset: 0,
    dropTargetSelector: null,
    scrollContainerSelector: null,
    scrollOffsetTopSelector: null,
    scrollOffsetBottomSelector: null,

    // internal properties
    editor: null,
    activeMarkupTagNames: null,
    activeSectionTagNames: null,
    selectedRange: null,
    componentCards: null,
    linkRange: null,
    selectedCard: null,

    // private properties
    _localMobiledoc: null,
    _upstreamMobiledoc: null,
    _startedRunLoop: false,
    _lastIsEditingDisabled: false,
    _isRenderingEditor: false,
    _skipCursorChange: false,
    _modifierKeys: null,

    // closure actions
    willCreateEditor() {},
    didCreateEditor() {},
    onChange() {},
    cursorDidExitAtTop() {},
    wordCountDidChange() {},

    /* computed properties -------------------------------------------------- */

    // merge in named options with any passed in `options` property data-bag
    editorOptions: computed(function () {
        let options = this.options || {};
        let atoms = this.atoms || [];
        let cards = this.cards || [];

        // add our default atoms and cards, we want the defaults to be first so
        // that they can be overridden by any passed-in atoms or cards.
        // Use Array.concat to avoid modifying any passed in array references
        atoms = Array.concat(defaultAtoms, atoms);
        cards = Array.concat(defaultCards, cards);

        return assign({
            placeholder: this.placeholder,
            spellcheck: this.spellcheck,
            autofocus: this.autofocus,
            atoms,
            cards
        }, options);
    }),

    /* lifecycle hooks ------------------------------------------------------ */

    init() {
        this._super(...arguments);

        // set a blank mobiledoc if we didn't receive anything
        let mobiledoc = this.mobiledoc;
        if (!mobiledoc) {
            mobiledoc = BLANK_DOC;
            this.set('mobiledoc', mobiledoc);
        }

        this.set('componentCards', A([]));
        this.set('activeMarkupTagNames', {});
        this.set('activeSectionTagNames', {});

        this._modifierKeys = {
            shift: false,
            alt: false,
            ctrl: false
        };

        // track mousedown/mouseup on the window rather than the ember component
        // so that we're sure to get the events even when they start outside of
        // this component or end outside the window.
        // Mouse events are used to track when a mousebutton is down so that we
        // can disable automatic cursor-in-viewport scrolling
        this._onMousedownHandler = run.bind(this, this.handleMousedown);
        window.addEventListener('mousedown', this._onMousedownHandler);
        this._onMouseupHandler = run.bind(this, this.handleMouseup);
        window.addEventListener('mouseup', this._onMouseupHandler);

        this._startedRunLoop = false;
    },

    willRender() {
        // use a default mobiledoc. If there are no changes then return early
        let mobiledoc = this.mobiledoc || BLANK_DOC;
        let mobiledocIsSame =
            (this._localMobiledoc && this._localMobiledoc === mobiledoc) ||
            (this._upstreamMobiledoc && this._upstreamMobiledoc === mobiledoc);
        let isEditingDisabledIsSame =
            this._lastIsEditingDisabled === this.isEditingDisabled;

        // no change to mobiledoc, no need to recreate the editor
        if (mobiledocIsSame && isEditingDisabledIsSame) {
            return;
        }

        // update our internal references
        this._lastIsEditingDisabled = this.isEditingDisabled;
        this._upstreamMobiledoc = mobiledoc;
        this._localMobiledoc = null;

        // trigger the willCreateEditor closure action
        this.willCreateEditor();

        // teardown any old editor that might be around
        let editor = this.editor;
        if (editor) {
            editor.destroy();
        }

        // create a new editor
        let editorOptions = this.editorOptions;
        editorOptions.mobiledoc = mobiledoc;
        editorOptions.showLinkTooltips = false;
        editorOptions.undoDepth = UNDO_DEPTH;
        editorOptions.parserPlugins = parserPlugins;

        let componentHooks = {
            // triggered when a card section is added to the mobiledoc
            [ADD_CARD_HOOK]: ({env, options, payload}, koenigOptions) => {
                let cardName = env.name;
                let componentName = CARD_COMPONENT_MAP[cardName];

                // the payload must be copied to avoid sharing the reference
                // `payload.files` is special because it's set by paste/drag-n-drop
                // events and can't be copied for security reasons
                let {files} = payload;
                let payloadCopy = copy(payload, true);
                payloadCopy.files = files;

                // all of the properties that will be passed through to the
                // component cards via the template
                let card = EmberObject.create({
                    cardName,
                    componentName,
                    koenigOptions,
                    payload: payloadCopy,
                    env,
                    options,
                    editor,
                    postModel: env.postModel,
                    isSelected: false,
                    isEditing: false
                });

                // the desination element is the container that gets rendered
                // inside the editor, once rendered we use {{-in-element}} to
                // wormhole in the actual ember component
                let cardId = guidFor(card);
                let destinationElementId = `koenig-editor-card-${cardId}`;
                let destinationElement = document.createElement('div');
                destinationElement.id = destinationElementId;

                card.setProperties({
                    destinationElementId,
                    destinationElement
                });

                // after render we render the full ember card via {{-in-element}}
                run.schedule('afterRender', () => {
                    this.componentCards.pushObject(card);
                });

                // render the destination element inside the editor
                return {card, element: destinationElement};
            },
            // triggered when a card section is removed from the mobiledoc
            [REMOVE_CARD_HOOK]: (card) => {
                this.componentCards.removeObject(card);
            }
        };
        editorOptions.cardOptions = componentHooks;

        editor = new Editor(editorOptions);

        // set up key commands and text expansions (MD conversion)
        // TODO: this will override any passed in options, we should allow the
        // default behaviour to be overridden by addon consumers
        registerKeyCommands(editor, this);
        registerTextExpansions(editor, this);

        // set up editor hooks
        editor.willRender(() => {
            // The editor's render/rerender will happen after this `editor.willRender`,
            // so we explicitly start a runloop here if there is none, so that the
            // add/remove card hooks happen inside a runloop.
            // When pasting text that gets turned into a card, for example,
            // the add card hook would run outside the runloop if we didn't begin a new
            // one now.
            if (!run.currentRunLoop) {
                this._startedRunLoop = true;
                run.begin();
            }
        });

        editor.didRender(() => {
            // if we had explicitly started a runloop in `editor.willRender`,
            // we must explicitly end it here
            if (this._startedRunLoop) {
                this._startedRunLoop = false;
                run.end();
            }

            if (this._cleanupScheduled) {
                run.schedule('afterRender', this, this._cleanup);
            }
        });

        editor.postDidChange(() => {
            run.join(() => {
                this.postDidChange(editor);
            });
        });

        editor.cursorDidChange(() => {
            run.join(() => {
                this.cursorDidChange(editor);
            });
        });

        editor.inputModeDidChange(() => {
            if (this.isDestroyed) {
                return;
            }
            run.join(() => {
                this.inputModeDidChange(editor);
            });
        });

        if (this.isEditingDisabled) {
            editor.disableEditing();
        }

        this.set('editor', editor);
        this.didCreateEditor(this);

        run.schedule('afterRender', this, this._registerCardReorderDragDropHandler);
        run.schedule('afterRender', this, this._calculateWordCount);
    },

    didInsertElement() {
        this._super(...arguments);
        let editorElement = this.element.querySelector('[data-kg="editor"]');

        this._pasteHandler = run.bind(this, this.handlePaste);
        editorElement.addEventListener('paste', this._pasteHandler);

        if (this.scrollContainerSelector) {
            this._scrollContainer = document.querySelector(this.scrollContainerSelector);
        }

        this._keydownHandler = run.bind(this, this.handleKeydown);
        window.addEventListener('keydown', this._keydownHandler);
        this._keyupHandler = run.bind(this, this.handleKeyup);
        window.addEventListener('keyup', this._keyupHandler);

        this._dropTarget = document.querySelector(this.dropTargetSelector) || this.element;
        this._dragOverHandler = run.bind(this, this.handleDragOver);
        this._dragLeaveHandler = run.bind(this, this.handleDragLeave);
        this._dropHandler = run.bind(this, this.handleDrop);
        this._dropTarget.addEventListener('dragover', this._dragOverHandler);
        this._dropTarget.addEventListener('dragleave', this._dragLeaveHandler);
        this._dropTarget.addEventListener('drop', this._dropHandler);
    },

    // our ember component has rendered, now we need to render the mobiledoc
    // editor itself if necessary
    didRender() {
        this._super(...arguments);
        let editor = this.editor;
        if (!editor.hasRendered) {
            let editorElement = this.element.querySelector('[data-kg="editor"]');
            this._isRenderingEditor = true;
            editor.render(editorElement);
            this._isRenderingEditor = false;
        }
    },

    willDestroyElement() {
        let {editor, _dropTarget, _cardDragDropContainer} = this;

        _dropTarget.removeEventListener('dragover', this._dragOverHandler);
        _dropTarget.removeEventListener('dragleave', this._dragLeaveHandler);
        _dropTarget.removeEventListener('drop', this._dropHandler);

        window.removeEventListener('keydown', this._keydownHandler);
        window.removeEventListener('keyup', this._keyupHandler);

        let editorElement = this.element.querySelector('[data-kg="editor"]');
        editorElement.removeEventListener('paste', this._pasteHandler);

        _cardDragDropContainer.destroy();

        editor.destroy();

        this._super(...arguments);
    },

    actions: {
        exitCursorAtTop() {
            if (this.selectedCard) {
                this.deselectCard(this.selectedCard);
            }

            this.cursorDidExitAtTop();
        },

        toggleMarkup(markupTagName, postEditor) {
            (postEditor || this.editor).toggleMarkup(markupTagName);
        },

        toggleSection(sectionTagName, postEditor) {
            (postEditor || this.editor).toggleSection(sectionTagName);
        },

        toggleHeaderSection(headingTagName, postEditor, options = {}) {
            let editor = this.editor;

            // skip toggle if we already have the same heading level
            if (!options.force && editor.activeSection.tagName === headingTagName) {
                return;
            }

            let operation = function (postEditor) {
                // strip all formatting aside from links
                postEditor.removeMarkupFromRange(
                    editor.activeSection.toRange(),
                    m => m.tagName !== 'a'
                );

                postEditor.toggleSection(headingTagName);
            };

            this._performEdit(operation, postEditor);
        },

        replaceWithCardSection(cardName, range, payload) {
            let editor = this.editor;
            let {head: {section}} = range;

            editor.run((postEditor) => {
                let {builder} = postEditor;
                let card = builder.createCardSection(cardName, payload);
                let nextSection = section.next;
                let needsTrailingParagraph = !nextSection;

                postEditor.replaceSection(section, card);

                // add an empty paragraph after if necessary so writing can continue
                if (needsTrailingParagraph) {
                    let newSection = postEditor.builder.createMarkupSection('p');
                    postEditor.insertSectionAtEnd(newSection);
                    postEditor.setRange(newSection.tailPosition());
                } else {
                    postEditor.setRange(nextSection.headPosition());
                }
            });

            // cards are pushed on to the `componentCards` array so we can
            // assume that the last card in the list is the one we want to
            // select. Needs to be scheduled afterRender so that the new card
            // is actually present
            run.schedule('afterRender', this, function () {
                let card = this.componentCards.lastObject;

                if (card.koenigOptions.hasEditMode) {
                    this.editCard(card);
                } else if (card.koenigOptions.selectAfterInsert) {
                    this.selectCard(card);
                }
            });
        },

        selectCard(card) {
            this.selectCard(card);
        },

        editCard(card) {
            this.editCard(card);
        },

        deselectCard(card) {
            this.deselectCard(card);
        },

        // range should be set to the full extent of the selection or the
        // appropriate <a> markup. If there's a selection when the link edit
        // component renders it will re-select when finished which should
        // trigger the normal toolbar
        editLink(range) {
            let linkMarkup = getLinkMarkupFromRange(range);
            if ((!range.isCollapsed || linkMarkup) && range.headSection.isMarkerable) {
                this.set('linkRange', range);
            }
        },

        cancelEditLink() {
            this.set('linkRange', null);
        },

        deleteCard(card, cursorMovement = CURSOR_AFTER) {
            this.deleteCard(card, cursorMovement);
        },

        moveCursorToPrevSection(card) {
            let section = this.getSectionFromCard(card);

            if (section.prev) {
                this.deselectCard(card);
                this.moveCaretToTailOfSection(section.prev, false);
            }
        },

        moveCursorToNextSection(card) {
            let section = this.getSectionFromCard(card);

            if (section.next) {
                this.deselectCard(card);
                this.moveCaretToHeadOfSection(section.next, false);
            } else {
                this.send('addParagraphAfterCard', card);
            }
        },

        addParagraphAfterCard(card) {
            let editor = this.editor;
            let section = this.getSectionFromCard(card);
            let collection = section.parent.sections;
            let nextSection = section.next;

            this.deselectCard(card);

            editor.run((postEditor) => {
                let {builder} = postEditor;
                let newPara = builder.createMarkupSection('p');

                if (nextSection) {
                    postEditor.insertSectionBefore(collection, newPara, nextSection);
                } else {
                    postEditor.insertSectionAtEnd(newPara);
                }

                postEditor.setRange(newPara.tailPosition());
            });
        }
    },

    /* public interface ----------------------------------------------------- */
    // TODO: find a better way to expose the public interface?

    // HACK: this scheduled cleanup is a bit hacky. We call .cleanup when
    // initializing Koenig in our editor controller but we have to wait for
    // rendering to finish so that componentCards is populated, even then
    // it's unlikely the card.component registration has finished.
    //
    // TODO: see if there's a way we can perform cleanup directly on the
    // mobiledoc, maybe with a "cleanupOnInit" option so that we modify the
    // mobiledoc before we start rendering
    cleanup() {
        this._cleanupScheduled = true;
    },

    _cleanup() {
        this.componentCards.forEach((card) => {
            let shouldDelete = card.koenigOptions.deleteIfEmpty;

            if (!shouldDelete) {
                return;
            }

            if (typeof shouldDelete === 'string') {
                let payloadKey = shouldDelete;
                shouldDelete = card => isBlank(get(card, payloadKey));
            }

            if (shouldDelete(card)) {
                this.deleteCard(card, NO_CURSOR_MOVEMENT);
            }
        });
        this._cleanupScheduled = false;
    },

    /* mobiledoc event handlers --------------------------------------------- */

    postDidChange(editor) {
        let serializeVersion = this.serializeVersion;
        let updatedMobiledoc = editor.serialize(serializeVersion);
        this._localMobiledoc = updatedMobiledoc;

        // trigger closure action
        this.onChange(updatedMobiledoc);

        // re-calculate word count
        this._calculateWordCount();

        // refresh drag/drop
        // TODO: can be made more performant by only refreshing when droppable
        // order changes or when sections are added/removed
        this._cardDragDropContainer.refresh();
    },

    cursorDidChange(editor) {
        let {head, tail, direction, isCollapsed, head: {section}} = editor.range;

        // sometimes we perform a programatic edit that causes a cursor change
        // but we actually want to skip the default behaviour because we've
        // already handled it, e.g. on card insertion, manual card selection
        if (this._skipCursorChange) {
            this._skipCursorChange = false;
            this.set('selectedRange', editor.range);
            this._scrollCursorIntoView();
            return;
        }

        // ignore the cursor moving from one end to the other within a selected
        // card section, clicking and other interactions within a card can cause
        // this to happen and we don't want to select/deselect accidentally.
        // See the up/down/left/right key handlers for the card selection
        if (this.selectedCard && this.selectedCard.postModel === section) {
            return;
        }

        // select the card if the cursor is on the before/after &zwnj; char
        if (section && isCollapsed && section.type === 'card-section') {
            if (head.offset === 0 || head.offset === 1) {
                // select card after render to ensure that our componentCards
                // attr is populated
                run.schedule('afterRender', this, () => {
                    let card = this.getCardFromSection(section);
                    this.selectCard(card);
                    this.set('selectedRange', editor.range);
                });
                return;
            }
        }

        // deselect any selected card because the cursor is no longer on a card
        if (this.selectedCard && !editor.range.isBlank) {
            this.deselectCard(this.selectedCard);
        }

        // if we have `code` or ~strike~ formatting to the left but not the right
        // then toggle the formatting - these formats should only be creatable
        // through the text expansions
        toggleSpecialFormatEditState(editor);

        // do not include the tail section if it's offset is 0
        // fixes triple-click unexpectedly selecting two sections for section-level formatting
        // https://github.com/bustle/mobiledoc-kit/issues/597
        if (direction === 1 && !isCollapsed && tail.offset === 0 && tail.section.prev) {
            let finalSection = tail.section.prev;
            let newRange = new MobiledocRange(head, finalSection.tailPosition());
            return editor.selectRange(newRange);
        }

        // pass the selected range through to the toolbar + menu components
        this.set('selectedRange', editor.range);
        this._scrollCursorIntoView();
    },

    // fired when the active section(s) or markup(s) at the current cursor
    // position or selection have changed. We use this event to update the
    // activeMarkup/section tag lists which control button states in our popup
    // toolbar
    inputModeDidChange(editor) {
        let markupTags = arrayToMap(editor.activeMarkups.map(m => m.tagName));
        // editor.activeSections are leaf sections.
        // Map parent section tag names (e.g. 'p', 'ul', 'ol') so that list buttons
        // are updated.
        // eslint-disable-next-line no-confusing-arrow
        let sectionParentTagNames = editor.activeSections.map(s => s.isNested ? s.parent.tagName : s.tagName);
        let sectionTags = arrayToMap(sectionParentTagNames);

        // On keyboard cursor movement our `cursorDidChange` toggle for special
        // formats happens before mobiledoc's readstate updates the edit states
        // so we have to re-do it here
        // TODO: can we make the event order consistent in mobiledoc-kit?
        toggleSpecialFormatEditState(editor);

        // Avoid updating this component's properties synchronously while
        // rendering the editor (after rendering the component) because it
        // causes Ember to display deprecation warnings
        if (this._isRenderingEditor) {
            run.schedule('afterRender', () => {
                this.set('activeMarkupTagNames', markupTags);
                this.set('activeSectionTagNames', sectionTags);
            });
        } else {
            this.set('activeMarkupTagNames', markupTags);
            this.set('activeSectionTagNames', sectionTags);
        }
    },

    /* custom event handlers ------------------------------------------------ */

    // we keep track of the modifier keys that are pressed so that in other event
    // handlers we can adjust the behaviour. Necessary because the browser doesn't
    // natively provide any info on non-key events about which keys are pressed.
    //
    // German keyboard layouts use a dead key for the ` char so it doesn't
    // fire keypress events. We watch for the event triggered when pressing
    // spacebar to "finalise" the backtick input then call the text input
    // handlers manually instead.
    //
    // Does not work on Linux but it's easier to have keymaps without dead keys there
    handleKeydown(event) {
        let key = Key.fromEvent(event);
        this._updateModifiersFromKey(key, {isDown: true});

        if (event.key === 'Dead' && event.keyCode === 192) {
            return this._isGraveInput = true;
        }

        this._isGraveInput = false;

        // Chrome/Safari can be matched immediately on keydown unlike Firefox
        if (event.key === '`' && event.code === 'Space') {
            this._triggerTextHandlers();
        }
    },

    handleKeyup(event) {
        let key = Key.fromEvent(event);
        this._updateModifiersFromKey(key, {isDown: false});

        if (this._isGraveInput && event.key === ' ') {
            this._isGraveInput = false;
            this._triggerTextHandlers();
        }
    },

    handlePaste(event) {
        let {editor} = this;

        // don't trigger our paste handling for pastes within cards or outside
        // of the editor canvas. Avoids double-paste of content when pasting
        // into cards
        if (!editor.cursor.isAddressable(event.target)) {
            return;
        }

        // if we have image files pasted, create an image card for each and set
        // the payload.files property which will cause the image to be auto-uploaded
        // NOTE: browser support varies as of May 2018:
        // - Safari: will paste all images
        // - Chrome: will only paste the first image
        // - Firefox: will not paste any images
        let images = Array.from(event.clipboardData.files).filter(file => file.type.indexOf('image') > -1);
        if (images.length > 0) {
            event.preventDefault();
            event.stopImmediatePropagation();

            editor.run((postEditor) => {
                insertImageCards(images, postEditor);
            });
            return;
        }

        let range = editor.range;
        let {html, text} = getContentFromPasteEvent(event);

        if (text && validator.isURL(text)) {
            // if we have a text selection, make that selection a link
            if (range && !range.isCollapsed && range.headSection === range.tailSection && range.headSection.isMarkerable) {
                let linkMarkup = editor.builder.createMarkup('a', {href: text});
                editor.run((postEditor) => {
                    postEditor.addMarkupToRange(range, linkMarkup);
                });
                editor.selectRange(range.tail);

                // prevent mobiledoc's default paste event handler firing
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }

            // if there's no selection and cursor is on an empty paragraph,
            // insert the url as an embed card, unless SHIFT is pressed. Setting
            // the `linkOnError` option results in an immediate switch to a
            // plain link if the embed fails for any reason (eg, unknown provider)
            if (range && range.isCollapsed && range.headSection.isBlank && !range.headSection.isListItem) {
                if (!this._modifierKeys.shift) {
                    editor.run((postEditor) => {
                        let payload = {url: text, linkOnError: true};
                        let card = postEditor.builder.createCardSection('embed', payload);
                        let nextSection = range.headSection.next;

                        postEditor.replaceSection(range.headSection, card);

                        // move caret to the next section, creating a blank one
                        // if none exists
                        if (nextSection) {
                            postEditor.setRange(nextSection.headPosition());
                        } else {
                            let newSection = postEditor.builder.createMarkupSection('p');
                            postEditor.insertSectionAtEnd(newSection);
                            postEditor.setRange(newSection.headPosition());
                        }
                    });
                } else {
                    // ensure the pasted URL is still auto-linked when Shift is pressed
                    editor.run((postEditor) => {
                        let linkMarkup = editor.builder.createMarkup('a', {href: text});
                        postEditor.insertTextWithMarkup(range.head, text, [linkMarkup]);
                    });
                }

                // prevent mobiledoc's default paste event handler firing
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
        }

        // if plain text is pasted we run it through our markdown parser so that
        // we get better output than mobiledoc's default text parsing and we can
        // provide an easier MD->Mobiledoc conversion route
        // NOTE: will not work in Edge which only ever exposes `html`
        if (text && !html && !this._modifierKeys.shift) {
            // prevent mobiledoc's default paste event handler firing
            event.preventDefault();
            event.stopImmediatePropagation();

            // we can't modify the paste event itself so we trigger a mock
            // paste event with our own data
            let pasteEvent = {
                type: 'paste',
                preventDefault() {},
                target: editor.element,
                clipboardData: {
                    getData(type) {
                        if (type === 'text/html') {
                            return formatMarkdown(text, false);
                        }
                    }
                }
            };

            editor.triggerEvent(editor.element, 'paste', pasteEvent);
        }

        // we need to standardise HTML here because parserPlugins do not get
        // passed inline markup such as `<b>` or `<i>`
        if (html) {
            // prevent mobiledoc's default paste event handler firing
            event.preventDefault();
            event.stopImmediatePropagation();

            let normalizedHtml = html
                .replace(/<b(\s|>)/gi, '<strong$1')
                .replace(/<\/b>/gi, '</strong>')
                .replace(/<i(\s|>)/gi, '<em$1')
                .replace(/<\/i>/gi, '</em>');

            // we can't modify the paste event itself so we trigger a mock
            // paste event with our own data
            let pasteEvent = {
                type: 'paste',
                preventDefault() {},
                target: editor.element,
                clipboardData: {
                    getData(type) {
                        if (type === 'text/plain') {
                            return text;
                        }
                        if (type === 'text/html') {
                            return normalizedHtml;
                        }
                    }
                }
            };

            editor.triggerEvent(editor.element, 'paste', pasteEvent);
        }
    },

    handleMousedown(event) {
        // we only care about the left mouse button
        if (event.which === 1) {
            this._isMouseDown = true;
        }
    },

    handleMouseup(event) {
        if (event.which === 1) {
            this._isMouseDown = false;
        }
    },

    handleDragOver(event) {
        if (!event.dataTransfer || event.target.closest('.__mobiledoc-card')) {
            return;
        }

        // this is needed to work around inconsistencies with dropping files
        // from Chrome's downloads bar
        if (navigator.userAgent.indexOf('Chrome') > -1) {
            let eA = event.dataTransfer.effectAllowed;
            event.dataTransfer.dropEffect = (eA === 'move' || eA === 'linkMove') ? 'move' : 'copy';
        }

        // indicate to the browser that we want to handle drop behaviour here
        event.stopPropagation();
        event.preventDefault();
    },

    handleDragLeave(event) {
        event.preventDefault();
    },

    handleDrop(event) {
        // drops on cards that are in an edit state should be cancelled
        // editable cards should handle drag-n-drop themselves if needed
        let cardElem = event.target.closest('.__mobiledoc-card');
        if (cardElem) {
            let cardId = cardElem.firstChild.id;
            let card = this.componentCards.findBy('destinationElementId', cardId);
            if (card.isEditing || card.component.handlesDragDrop) {
                return;
            }
        }

        event.preventDefault();

        if (event.dataTransfer.files) {
            let images = Array.from(event.dataTransfer.files).filter(file => file.type.indexOf('image') > -1);
            if (images.length > 0) {
                this.editor.run((postEditor) => {
                    insertImageCards(images, postEditor);
                });
                this._scrollCursorIntoView({jumpToCard: true});
            }
        }
    },

    /* Ember event handlers ------------------------------------------------- */

    // disable dragging
    dragStart(event) {
        event.preventDefault();
    },

    /* public methods ------------------------------------------------------- */

    selectCard(card, isEditing = false) {
        // no-op if card is already selected
        if (card === this.selectedCard && isEditing === card.isEditing) {
            return;
        }

        // deselect any already selected card
        if (this.selectedCard && card !== this.selectedCard) {
            this.deselectCard(this.selectedCard);
        }

        // setting a card as selected trigger's the cards didReceiveAttrs
        // hook where the actual selection state change happens. Put into edit
        // mode if necessary
        card.setProperties({
            isEditing,
            isSelected: true
        });
        this.selectedCard = card;

        // hide the cursor and place it after the card so that ENTER can
        // create a new paragraph and cursorDidExitAtTop gets fired on LEFT
        // if the card is at the top of the document
        this._hideCursor();
        let section = this.getSectionFromCard(card);
        this.moveCaretToTailOfSection(section);
    },

    editCard(card) {
        // no-op if card is already being edited
        if (card === this.selectedCard && card.isEditing) {
            return;
        }

        // select the card with edit mode
        this.selectCard(card, true);
    },

    deselectCard(card) {
        card.set('isEditing', false);
        card.set('isSelected', false);
        this.selectedCard = null;
        this._showCursor();
    },

    deleteCard(card, cursorDirection) {
        this.editor.run((postEditor) => {
            let section = card.env.postModel;
            let nextPosition;

            if (cursorDirection === CURSOR_BEFORE) {
                nextPosition = section.prev && section.prev.tailPosition();
            } else {
                nextPosition = section.next && section.next.headPosition();
            }

            postEditor.removeSection(section);

            // if there's no prev or next section then the doc is empty, we want
            // to add a blank paragraph and place the cursor in it
            if (cursorDirection !== NO_CURSOR_MOVEMENT && !nextPosition) {
                let {builder} = postEditor;
                let newPara = builder.createMarkupSection('p');
                postEditor.insertSectionAtEnd(newPara);
                return postEditor.setRange(newPara.tailPosition());
            }

            if (cursorDirection !== NO_CURSOR_MOVEMENT) {
                return postEditor.setRange(nextPosition);
            }
        });
    },

    getCardFromSection(section) {
        if (!section || section.type !== 'card-section') {
            return;
        }

        let cardId = section.renderNode.element.querySelector('.__mobiledoc-card').firstChild.id;

        return this.componentCards.findBy('destinationElementId', cardId);
    },

    getCardFromElement(element) {
        if (!element) {
            return;
        }

        let cardElement = element.querySelector('.__mobiledoc-card') || getParent(element, '.__mobiledoc-card');

        if (!cardElement) {
            return;
        }

        let cardId = cardElement.firstChild.id;

        return this.componentCards.findBy('destinationElementId', cardId);
    },

    getSectionFromCard(card) {
        return card.env.postModel;
    },

    moveCaretToHeadOfSection(section, skipCursorChange = true) {
        this.moveCaretToSection(section, 'head', skipCursorChange);
    },

    moveCaretToTailOfSection(section, skipCursorChange = true) {
        this.moveCaretToSection(section, 'tail', skipCursorChange);
    },

    moveCaretToSection(section, position, skipCursorChange = true) {
        let sectionPosition = position === 'head' ? section.headPosition() : section.tailPosition();
        let range = sectionPosition.toRange();

        // don't trigger another cursor change selection after selecting
        if (skipCursorChange && !range.isEqual(this.editor.range)) {
            this._skipCursorChange = true;
        }

        this.editor.selectRange(range);
    },

    /* internal methods ----------------------------------------------------- */

    // nested editor.run loops will create additional undo steps so this is a
    // shortcut for when we already have a postEditor
    _performEdit(editOperation, postEditor) {
        if (postEditor) {
            editOperation(postEditor);
        } else {
            this.editor.run((postEditor) => {
                editOperation(postEditor);
            });
        }
    },

    _hideCursor() {
        this.editor.element.style.caretColor = 'transparent';
    },

    _showCursor() {
        this.editor.element.style.caretColor = 'auto';
    },

    _updateModifiersFromKey(key, {isDown}) {
        if (key.isShiftKey()) {
            this._modifierKeys.shift = isDown;
        } else if (key.isAltKey()) {
            this._modifierKeys.alt = isDown;
        } else if (key.isCtrlKey()) {
            this._modifierKeys.ctrl = isDown;
        }
    },

    _scrollCursorIntoView(options = {jumpToCard: false}) {
        // disable auto-scroll if the mouse or shift key is being used to create
        // a selection - the browser handles scrolling well in this case
        if (!this._scrollContainer || this._isMouseDown || this._modifierKeys.shift) {
            return;
        }

        let {range} = this.editor;
        let selection = window.getSelection();
        let windowRange;
        // Safari can throw an IndexSizeError from selection.getRangeAt(0)
        if (selection.type !== 'None') {
            windowRange = selection && selection.getRangeAt(0);
        }
        let element = range.head && range.head.section && range.head.section.renderNode && range.head.section.renderNode.element;

        // prevent scroll jumps when a card is selected
        if (!options.jumpToCard && range && range.head.section && range.head.section.isCardSection) {
            return;
        }

        if (windowRange) {
            // cursorTop is relative to the window rather than document or scroll container
            let {top: cursorTop, height: cursorHeight} = windowRange.getBoundingClientRect();
            let viewportHeight = window.innerHeight;
            let offsetTop = 0;
            let offsetBottom = 0;
            let scrollTop = this._scrollContainer.scrollTop;

            if (this.scrollOffsetTopSelector) {
                let topElement = document.querySelector(this.scrollOffsetTopSelector);
                offsetTop = topElement ? topElement.offsetHeight : 0;
            }

            if (this.scrollOffsetBottomSelector) {
                let bottomElement = document.querySelector(this.scrollOffsetBottomSelector);
                offsetBottom = bottomElement ? bottomElement.offsetHeight : 0;
            }

            // for empty paragraphs the window selection range will be 0,0,0,0
            // so grab the element's bounding rect instead
            if (cursorTop === 0 && cursorHeight === 0) {
                if (!element) {
                    return;
                }

                ({top: cursorTop, height: cursorHeight} = element.getBoundingClientRect());
            }

            // keep cursor in view at the top
            if (cursorTop < 0 + offsetTop) {
                this._scrollContainer.scrollTop = scrollTop - offsetTop + cursorTop - 20;
                return;
            }

            let cursorBottom = cursorTop + cursorHeight;
            let paddingBottom = 0;
            let distanceFromViewportBottom = cursorBottom - viewportHeight;
            let atBottom = false;

            // if we're at the bottom of the doc we should keep the bottom
            // padding in view, otherwise just scroll to keep the cursor in view
            if (this._scrollContainer.scrollTop + this._scrollContainer.offsetHeight + 200 >= this._scrollContainer.scrollHeight) {
                atBottom = true;
                paddingBottom = parseFloat(getComputedStyle(this.element.parentNode).getPropertyValue('padding-bottom'));
            }

            if (cursorBottom > viewportHeight - offsetBottom - paddingBottom) {
                if (atBottom) {
                    this._scrollContainer.scrollTop = this._scrollContainer.scrollHeight;
                } else {
                    this._scrollContainer.scrollTop = scrollTop + offsetBottom + distanceFromViewportBottom + 20;
                }
            }
        }
    },

    _registerCardReorderDragDropHandler() {
        let cardDragDropContainer = this.koenigDragDropHandler.registerContainer(this.editor.element, {
            draggableSelector: ':scope > div', // cards
            droppableSelector: ':scope > *', // all block elements
            onDragStart: run.bind(this, function () {
                this._cardDragDropContainer.refresh();
            }),
            getDraggableInfo: run.bind(this, this._getDraggableInfo),
            createGhostElement: run.bind(this, this._createCardDragElement),
            getIndicatorPosition: run.bind(this, this._getDropIndicatorPosition),
            onDrop: run.bind(this, this._onCardDrop)
        });

        this._cardDragDropContainer = cardDragDropContainer;
    },

    _getDraggableInfo(draggableElement) {
        let card = this.getCardFromElement(draggableElement);

        if (!card) {
            return false;
        }

        // TODO: payload should probably contain everything here as well as the
        // card payload so that draggableInfo has a consistent shape
        return {
            type: 'card',
            cardName: card.cardName,
            payload: card.payload,
            destinationElementId: card.destinationElementId
        };
    },

    _createCardDragElement(draggableInfo) {
        let {cardName} = draggableInfo;

        if (!cardName) {
            return;
        }

        let ghostElement = document.createElement('div');
        ghostElement.classList.add('absolute', 'flex', 'flex-column', 'justify-center',
            'items-center', 'w15', 'h15', 'br3', 'bg-white', 'shadow-2');
        ghostElement.style.top = '0';
        ghostElement.style.left = '-100%';
        ghostElement.style.zIndex = 10001;
        ghostElement.style.willChange = 'transform';

        let iconElement = document.createElement('div');
        iconElement.classList.add('flex', 'items-center');

        let svgIconHtml = svgJar(CARD_ICON_MAP[cardName], {class: 'w8 h8'});
        iconElement.insertAdjacentHTML('beforeend', svgIconHtml.string);

        ghostElement.appendChild(iconElement);
        return ghostElement;
    },

    _getDropIndicatorPosition(draggableInfo, droppableElem, position) {
        let droppables = Array.from(this.editor.element.querySelectorAll(':scope > *'));
        let droppableIndex = droppables.indexOf(droppableElem);
        let draggableIndex = droppables.indexOf(draggableInfo.element);

        // only allow card drag/drop for now so it's not possible to drag
        // images out of a gallery and see drop indicators in the post content
        if (draggableInfo.type !== 'card') {
            return false;
        }

        if (this._isCardDropAllowed(draggableIndex, droppableIndex, position)) {
            let insertIndex = droppableIndex;
            if (position.match(/bottom/)) {
                insertIndex += 1;
            }

            let beforeElems, afterElems;
            if (position.match(/bottom/)) {
                beforeElems = droppables.slice(0, droppableIndex + 1);
                afterElems = droppables.slice(droppableIndex + 1);
            } else {
                beforeElems = droppables.slice(0, droppableIndex);
                afterElems = droppables.slice(droppableIndex);
            }

            return {
                direction: 'vertical',
                position: position.match(/top/) ? 'top' : 'bottom',
                beforeElems,
                afterElems,
                insertIndex: insertIndex
            };
        }

        return false;
    },

    _onCardDrop(draggableInfo) {
        if (draggableInfo.type !== 'card') {
            return false;
        }

        let droppables = Array.from(this.editor.element.querySelectorAll(':scope > *'));
        let draggableIndex = droppables.indexOf(draggableInfo.element);

        if (this._isCardDropAllowed(draggableIndex, draggableInfo.insertIndex)) {
            let card = this.getCardFromElement(draggableInfo.element);
            let cardSection = this.getSectionFromCard(card);
            let difference = draggableIndex - draggableInfo.insertIndex;

            if (draggableIndex < draggableInfo.insertIndex) {
                difference += 1;
            }

            if (difference !== 0) {
                this.editor.run((postEditor) => {
                    do {
                        if (difference > 0) {
                            cardSection = postEditor.moveSectionUp(cardSection);
                            difference -= 1;
                        } else if (difference < 0) {
                            cardSection = postEditor.moveSectionDown(cardSection);
                            difference += 1;
                        }
                    } while (difference !== 0);
                });
            }
        }
    },

    // TODO: more or less duplicated in koenig-card-gallery other than direction
    // - move to DnD container?
    _isCardDropAllowed(draggableIndex, droppableIndex, position = '') {
        // can't drop on itself or when droppableIndex doesn't exist
        if (draggableIndex === droppableIndex || typeof droppableIndex === 'undefined') {
            return false;
        }

        // account for dropping at beginning or end of a row
        if (position.match(/top/)) {
            droppableIndex -= 1;
        }

        if (position.match(/bottom/)) {
            droppableIndex += 1;
        }

        return droppableIndex !== draggableIndex;
    },

    // calculate the number of words in rich-text sections and query cards for
    // their own word and image counts. Image counts are used for reading-time
    _calculateWordCount() {
        run.throttle(this, this._throttledWordCount, 100, false);
    },

    _throttledWordCount() {
        if (this.isDestroying || this.isDestroyed) {
            return;
        }

        let wordCount = 0;
        let imageCount = 0;

        this.editor.post.walkAllLeafSections((section) => {
            if (section.isCardSection) {
                // get counts from card components
                let card = this.getCardFromSection(section);
                let cardCounts = get(card, 'component.counts') || {};
                wordCount += cardCounts.wordCount || 0;
                imageCount += cardCounts.imageCount || 0;
            } else {
                wordCount += countWords(section.text);
            }
        });

        if (wordCount !== this.wordCount || imageCount !== this.imageCount) {
            let readingTime = calculateReadingTime({wordCount, imageCount});

            this.setProperties({
                wordCount,
                imageCount,
                readingTime
            });

            this.wordCountDidChange({wordCount, imageCount, readingTime});
        }
    },

    _triggerTextHandlers() {
        let {editor} = this;

        // don't trigger our text input handlers for pastes within cards or
        // outside of the editor canvas
        if (!editor.cursor.isAddressable(event.target)) {
            return;
        }

        // must be run after the normal events have finished so that the
        // backtick char exists in the editor
        run.next(this, function () {
            let matchedHandler = editor._eventManager._textInputHandler._findHandler();
            if (matchedHandler) {
                let [handler, matches] = matchedHandler;
                handler.run(editor, matches);
            }
        });
    },

    // store a reference to the editor for the acceptance test helpers
    _setExpandoProperty(editor) {
        let config = getOwner(this).resolveRegistration('config:environment');
        if (this.element && config.environment === 'test') {
            this.element[TESTING_EXPANDO_PROPERTY] = editor;
        }
    }
});
