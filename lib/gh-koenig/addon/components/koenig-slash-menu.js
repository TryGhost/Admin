import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import $ from 'jquery';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-slash-menu';

const ROW_LENGTH = 4;

export default Component.extend({
    layout,
    isOpen: false,
    toolsLength: 0,
    selected: 0,
    selectedTool: null,
    query: '',
    range: null,
    editor: null,
    toolbar: computed('query', 'range', 'selected', function () {
        let tools = [];
        let match = (this.query || '').trim().toLowerCase();
        let selected = this.get('selected');
        let i = 0;
        // todo cache active tools so we don't need to loop through them on selection change.
        this.tools.forEach((tool) => {
            if ((tool.type === 'block' || tool.type === 'card') && tool.cardMenu === true && (tool.label.toLowerCase().startsWith(match) || tool.name.toLowerCase().startsWith(match))) {
                let t = {
                    label: tool.label,
                    name: tool.name,
                    icon: tool.icon,
                    onClick: tool.onClick,
                    range: this.get('range'),
                    order: tool.order,
                    selected: false
                };

                tools.push(t);
                i++;
            }
        });
        this.set('toolsLength', i);
        tools.sort((a, b) => a.order > b.order);

        let selectedTool = tools[selected] || tools[0];
        if (selectedTool) {
            this.set('selectedTool', selectedTool);
            selectedTool.selected = true;
        }
        if (i === 0) {
            alert('close');
        }
        return tools;
    }),
    init() {
        this._super(...arguments);
        let editor = this.get('editor');
        this.set('tools', new Tools(editor, this));
    },

    willDestroy() {

    },

    didRender() {
        let editor = this.get('editor');
        let self = this;

        editor.cursorDidChange(this.cursorChange.bind(this));

        editor.onTextInput({
            name: 'slash_menu',
            text: '/',
            run() {
                self.send('openMenu');
            }
        });
    },
    cursorChange() {
        let editor = this.get('editor');
        let range = this.get('range');
        if (!range || !editor.range.isCollapsed || editor.range.head.section !== range.section || this.editor.range.head.offset < 1 || !this.editor.range.head.section) {
            this.send('closeMenu');
            return;
        }

        if (this.get('isOpen')) {
            let queryString = editor.range.head.section.text.substring(range.startOffset, editor.range.head.offset);
            this.set('query', queryString);
            if (queryString.length > 10) {
                this.send('closeMenu');
            }
        }
    },
    actions: {
        openMenu: function () { // eslint-disable-line
            let $editor = $(this.get('containerSelector'));
            let editor = this.get('editor');
            let self = this;

            this.set('query', '');
            this.set('isOpen', true);

            this.set('range', {
                section: editor.range.head.section,
                startOffset: editor.range.head.offset,
                endOffset: editor.range.head.offset
            });

            editor.registerKeyCommand({
                str: 'LEFT',
                name: 'slash',
                run() {
                    let item = self.get('selected');
                    let length = self.get('toolsLength');
                    if (item > 0) {
                        self.set('selected', item - 1);
                    } else {
                        self.set('selected', length - 1);
                    }
                }
            });

            editor.registerKeyCommand({
                str: 'RIGHT',
                name: 'slash',
                run() {
                    let item = self.get('selected');
                    let length = self.get('toolsLength');
                    if (item < length) {
                        self.set('selected', item + 1);
                    } else {
                        self.set('selected', 1);
                    }
                }
            });

            editor.registerKeyCommand({
                str: 'UP',
                name: 'slash',
                run() {
                    let item = self.get('selected');
                    if (item > ROW_LENGTH) {
                        self.set('selected', item - ROW_LENGTH);
                    } else {
                        self.set('selected', 0);
                    }
                }
            });

            editor.registerKeyCommand({
                str: 'DOWN',
                name: 'slash',
                run() {
                    let item = self.get('selected');
                    let length = self.get('toolsLength');
                    if (item + ROW_LENGTH < length) {
                        self.set('selected', item + ROW_LENGTH);
                    } else {
                        self.set('selected', length - 1);
                    }
                }
            });

            editor.registerKeyCommand({
                str: 'ENTER',
                name: 'slash',
                run(postEditor) {

                    let {range} = postEditor;

                    range.head.offset = self.get('range').startOffset - 1;
                    postEditor.deleteRange(range);
                    self.get('selectedTool').onClick(self.get('editor'));
                    self.send('closeMenu');
                }
            });

            editor.registerKeyCommand({
                str: 'ESC',
                name: 'slash',
                run() {
                    self.send('closeMenu');
                }
            });

            let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.

            let position =  range.getBoundingClientRect();
            let edOffset = $editor.offset();

            run.schedule('afterRender', this,
                () => {
                    let menu = this.$('.gh-cardmenu');
                    menu.css('top', position.top + $editor.scrollTop() - edOffset.top + 20);
                    menu.css('left', position.left + (position.width / 2) + $editor.scrollLeft() - edOffset.left);
                    this.$('.gh-cardmenu-search-input').focus();
                });
        },
        closeMenu: function () { // eslint-disable-line
            this.set('isOpen', false);
            let editor = this.get('editor');
            // this.get('editor').unregisterKeyCommand('slash'); -- waiting for the next release for this

            for (let i = editor._keyCommands.length - 1; i > -1; i--) {
                let keyCommand = editor._keyCommands[i];
                if (keyCommand.name === 'slash') {
                    editor._keyCommands.splice(i, 1);
                }
            }
        }
    }
});
