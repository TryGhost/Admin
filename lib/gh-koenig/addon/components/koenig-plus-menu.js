import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-plus-menu';

export default Component.extend({
    layout,
    isOpen: false,
    isButton: false,
    showButton: computed('isOpen', 'isButton', function () {
        return this.get('isOpen') || this.get('isButton');
    }),
    toolsLength: 0,
    selectedItem: 0,
    selectedTool: null,
    query: '',
    range: null,
    editor: null,
    toolbar: computed('query', 'range', 'selectedItem', function () {
        let tools = [];
        let match = (this.query || '').trim().toLowerCase();
        let selected = this.get('selectedItem');
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

                if (i === selected) {
                    this.set('selectedTool', t);
                    t.selected = true;
                }

                tools.push(t);
                i++;
            }
        });
        this.set('toolsLength', i);
        tools.sort((a, b) => a.order > b.order);
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

        this.$('.gh-cardmenu-search-input').blur(() => {
            // this.send('closeMenu');
        });

        input.keypress(({keycode}) => {
            let selectedItem = this.get('selectedItem');
            switch (keycode) {
            case 27: // escape
                return this.send('closeMenu');
            case 37: // left
                if (selectedItem > 0) {
                    this.set('selectedItem', selectedItem--);
                }
                break;
            case 38: // up
                if (selectedItem > 4) {
                    this.set('selectedItem', selectedItem -= 4);
                }
                break;
            case 39: // right
                selectedItem++;
                break;
            case 40: // down
                selectedItem += 4;
                break;
            case 13: // enter
                alert('enter');
            }
        });

        editor.cursorDidChange(() => {
            // if((!editor.range || !editor.range.head.section || !editor.range.head.section.isBlank) && !this.get('range').section) {
            //     // fadeout
            //     this.set('isOpen', false);
            //     this.set('isButton', false);
            //     return;
            // }

            // let currentNode = this.get('range').section.renderNode.element;

            // let offset = this.$(currentNode).position();
            // let editorOffset = $editor.offset();

            // this.set('isButton', true);
            // run.schedule('afterRender', this,
            //     () => {
            //         let button = this.$('#gh-cardmenu-button');
            //         button.css('top', offset.top + $editor.scrollTop() - editorOffset.top - 5);
            //         if(currentNode.tagName.toLowerCase()==='li') {
            //             button.css('left', this.$(currentNode.parentNode).position().left + $editor.scrollLeft() - 90);
            //         } else {
            //             button.css('left', offset.left + $editor.scrollLeft() - 90);
            //         }
            //     });
        });
    },
    actions: {
        openMenu: () => {
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
        closeMenu: () => {
            this.set('isOpen', false);
            this.set('isButton', false);
        },
        updateSelection: (event) => {
            alert(event);
        }
    }
});
