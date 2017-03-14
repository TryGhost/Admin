import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-plus-menu';
import $ from 'jquery';

const ROW_LENGTH = 4;

export default Component.extend({
    layout,
    isOpen: false,
    isButton: false,
    showButton: computed('isOpen', 'isButton', function () {
        return this.get('isOpen') || this.get('isButton');
    }),
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

        return tools;
    }),
    init() {
        this._super(...arguments);
        this.tools = new Tools(this.get('editor'), this);
    },

    willDestroy() {

    },

    didRender() {
        let editor = this.get('editor');
        let input = this.$('.gh-cardmenu-search-input');
        let $editor = $(this.get('containerSelector'));

        input.blur(() => {
            window.setTimeout(() => {
                this.send('closeMenu');
            }, 200);
        });

        input.keydown(({keyCode}) => {
            let item = this.get('selected');
            let length = this.get('toolsLength');
            switch (keyCode) {
            case 27: // escape
                return this.send('closeMenu');
            case 37: // left
                if (item > 0) {
                    this.set('selected', item - 1);
                } else {
                    this.set('selected', length - 1);
                }
                break;
            case 38: // up
                if (item > ROW_LENGTH) {
                    this.set('selected', item - ROW_LENGTH);
                } else {
                    this.set('selected', 0);
                }
                break;
            case 39: // right
                if (item < length) {
                    this.set('selected', item + 1);
                } else {
                    this.set('selected', 1);
                }
                break;
            case 40: // down
                if (item + ROW_LENGTH < length) {
                    this.set('selected', item + ROW_LENGTH);
                } else {
                    this.set('selected', length - 1);
                }
                break;
            case 13: // enter
                alert('enter');
            }
        });

        editor.cursorDidChange(() => {
            if (!editor.range || !editor.range.head.section) {
                return;
            }

            if (!editor.range.head.section.isBlank) {
                this.send('closeMenu');
                return;
            }

            let currentNode = editor.range.head.section.renderNode.element;

            let offset = this.$(currentNode).position();
            let editorOffset = $editor.offset();

            this.set('isButton', true);
            run.schedule('afterRender', this,
                () => {
                    let button = this.$('#gh-cardmenu-button');
                    button.css('top', offset.top + $editor.scrollTop() - editorOffset.top - 5);
                    if (currentNode.tagName.toLowerCase() === 'li') {
                        button.css('left', this.$(currentNode.parentNode).position().left + $editor.scrollLeft() - 90);
                    } else {
                        button.css('left', offset.left + $editor.scrollLeft() - 90);
                    }
                });
        });
    },
    actions: {
        openMenu: function () { // eslint-disable-line
            let button = this.$('#gh-cardmenu-button');
            let editor = this.get('editor');
            this.set('isOpen', true);

            this.set('range', {
                section: editor.range.head.section,
                startOffset: editor.range.head.offset,
                endOffset: editor.range.head.offset
            });
            this.propertyDidChange('toolbar');

            run.schedule('afterRender', this,
                () => {
                    let menu = this.$('.gh-cardmenu');
                    menu.css('top', button.css('top'));
                    menu.css('left', button.css('left') + button.width());
                    this.$('.gh-cardmenu-search-input').focus();
                });
        },
        closeMenu: function () { // eslint-disable-line
            this.set('isOpen', false);
            this.set('isButton', false);
        },
        updateSelection: function (event) { // eslint-disable-line
            alert(event);
        }
    }
});
