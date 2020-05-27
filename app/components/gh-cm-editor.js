/* global CodeMirror */
import Component from '@ember/component';
import boundOneWay from 'ghost-admin/utils/bound-one-way';
import {assign} from '@ember/polyfills';
import {bind, once, scheduleOnce} from '@ember/runloop';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

const CmEditorComponent = Component.extend({
    lazyLoader: service(),

    classNameBindings: ['isFocused:focus'],

    textareaClass: '',
    isFocused: false,

    // options for the editor
    autofocus: false,
    indentUnit: 4,
    lineNumbers: true,
    lineWrapping: false,
    mode: 'htmlmixed',
    theme: 'xq-light',
    styleSelectedText: true,

    _editor: null, // reference to CodeMirror editor

    _prevSelectedLineNumber: null,

    // Allowed actions
    'focus-in': () => {},
    update: () => {},

    _value: boundOneWay('value'), // make sure a value exists

    didReceiveAttrs() {
        if (this._value === null || undefined) {
            this.set('_value', '');
        }

        if (this.mode !== this._lastMode && this._editor) {
            this._editor.setOption('mode', this.mode);
        }
        this._lastMode = this.mode;
    },

    didInsertElement() {
        this._super(...arguments);
        this.initCodeMirror.perform();
    },

    willDestroyElement() {
        this._super(...arguments);

        // Ensure the editor exists before trying to destroy it. This fixes
        // an error that occurs if codemirror hasn't finished loading before
        // the component is destroyed.
        if (this._editor) {
            let editor = this._editor.getWrapperElement();
            editor.parentNode.removeChild(editor);
            this._editor = null;
        }
    },

    actions: {
        updateFromTextarea(value) {
            this.update(value);
        }
    },

    initCodeMirror: task(function* () {
        let loader = this.lazyLoader;
        yield loader.loadScript('codemirror', 'assets/codemirror/codemirror.js');

        scheduleOnce('afterRender', this, this._initCodeMirror);
    }),

    _initCodeMirror() {
        let options = this.getProperties('lineNumbers', 'lineWrapping', 'indentUnit', 'mode', 'theme', 'autofocus', 'styleSelectedText');
        assign(options, {value: this._value});

        let textarea = this.element.querySelector('textarea');
        if (textarea && textarea === document.activeElement) {
            options.autofocus = true;
        }

        this._editor = new CodeMirror.fromTextArea(textarea, options);

        if (this.linesInfo) {
            this.linesInfo.split(',').forEach((lineNumber) => {
                const indexLikeNumber = Number(lineNumber) - 1;
                this._highlightLine(indexLikeNumber, false);
            });
        }

        // by default CodeMirror will place the cursor at the beginning of the
        // content, it makes more sense for the cursor to be at the end
        if (options.autofocus) {
            this._editor.setCursor(this._editor.lineCount(), 0);
        }

        // events
        this._setupCodeMirrorEventHandler('focus', this, this._focus);
        this._setupCodeMirrorEventHandler('blur', this, this._blur);
        this._setupCodeMirrorEventHandler('change', this, this._update);
        this._setupCodeMirrorEventHandler('gutterClick', this, this._gutterClick);
    },

    _setupCodeMirrorEventHandler(event, target, method) {
        let callback = bind(target, method);

        this._editor.on(event, callback);

        this.one('willDestroyElement', this, function () {
            this._editor.off(event, callback);
        });
    },

    _update(codeMirror, changeObj) {
        once(this, this.update, codeMirror.getValue(), codeMirror, changeObj);
    },

    _focus(codeMirror, event) {
        this.set('isFocused', true);
        once(this, this['focus-in'], codeMirror.getValue(), codeMirror, event);
    },

    _blur(/* codeMirror, event */) {
        this.set('isFocused', false);
    },

    _gutterClick(codeMirror, lineNumber, gutter, event) {
        if (event.shiftKey && Number.isInteger(this._prevSelectedLineNumber)) { //multiple selection branch
            const min = Math.min(this._prevSelectedLineNumber, lineNumber);
            const selectedLineNumbers = Array.from(Array(Math.abs(this._prevSelectedLineNumber - lineNumber) + 1), (_, i) => min + i);

            selectedLineNumbers.forEach((lineNumber) => {
                const marks = this._editor.findMarksAt({line: lineNumber, ch: 0});

                if (!marks.length) {
                    this._highlightLine(lineNumber);
                    this._prevSelectedLineNumber = lineNumber;
                }
            });
        } else { // single selection branch
            const marks = this._editor.findMarksAt({line: lineNumber, ch: 0});

            if (marks.length) {
                marks[0].clear();
                this.updateLinesInfo('remove', lineNumber + 1);
                if (this._prevSelectedLineNumber === lineNumber) {
                    this._prevSelectedLineNumber = null;
                }
            } else {
                this._highlightLine(lineNumber);
                this._prevSelectedLineNumber = lineNumber;
            }
        }
    },

    _highlightLine(lineNumber, notifyParent = true) {
        const lineLength = this._editor.getLine(lineNumber).length || 1;
        const marker = this._editor.markText({line: lineNumber, ch: 0}, {line: lineNumber, ch: lineLength}, {className: 'CodeMirror-selected-line'});

        const hideCallback = () => {
            this.updateLinesInfo('remove', lineNumber + 1);
            marker.clear();
            marker.off('hide', hideCallback);
        };

        // clear markers on line removal
        marker.on('hide', hideCallback);

        if (notifyParent) {
            this.updateLinesInfo('add', lineNumber + 1);
        }
    }

});

export default CmEditorComponent;
