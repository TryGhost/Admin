import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import $ from 'jquery';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-plus-menu';

export default Component.extend({
    layout,
    isOpen: false,
    isButton: false,
    showButton: computed('isOpen', 'isButton', function () {
        console.log('showing buttons', this.get('isOpen') , this.get('isButton'));
        return this.get('isOpen') || this.get('isButton');
    }),
    toolsLength: 0,
    query: '',
    range: null,
    editor: null,
    toolbar: computed('query', 'range', function () {
        let tools = [];
        let match = (this.query || '').trim().toLowerCase();
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
                    order: tool.order
                };

                if (i === this.menuSelectedItem) {
                    this.set('selectedTool', t);
                }

                tools.push(t);
                i++;
            }
        });
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
        let $editor = $('.gh-editor-container');
        let menu = this.$('.gh-card-menu');

        
        this.$('.gh-cardmenu-search-input').blur((event) => {
            // this.send('closeMenu');
        });

        editor.cursorDidChange(() => {
            if((!editor.range || !editor.range.head.section || !editor.range.head.section.isBlank) && !this.get('isOpen')) {
                // fadeout
                console.log(0);
                this.set('isOpen', false);
                this.set('isButton', false);
                return;
            }
            console.log(1);
            let currentNode = editor.range.head.section.renderNode.element;
                                   
            let offset = this.$(currentNode).position();
            let editorOffset = $editor.offset();

            this.set('isButton', true);            
            run.schedule('afterRender', this,
                () => {
                    let button = this.$('#gh-cardmenu-button');
                    button.css('top', offset.top + $editor.scrollTop() - editorOffset.top - 5);
                    if(currentNode.tagName.toLowerCase()==='li') {
                        button.css('left', this.$(currentNode.parentNode).position().left + $editor.scrollLeft() - 90);
                    } else {
                        button.css('left', offset.left + $editor.scrollLeft() - 90);
                    }
                });

            
        });
    },
   
    actions: {
        openMenu: function() {
            
            let button = this.$('#gh-cardmenu-button');
            console.log(2);
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
        closeMenu: function() {
            console.log(3);
            this.set('isOpen', false);
            this.set('isButton', false);
        }
    }
});

