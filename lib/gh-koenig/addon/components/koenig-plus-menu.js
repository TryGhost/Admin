import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import $ from 'jquery';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-plus-menu';

export default Component.extend({
    layout,
    isOpen: false,
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
        let button = this.$('#gh-cardmenu-button');

        menu.hide();
        button.hide();
        
        editor.cursorDidChange(() => {
            if(!editor.range || !editor.range.head.section || !editor.range.head.section.isBlank) {
                // fadeout
                button.hide();
                return;
            }
            
            button.show();
            let currentNode = editor.range.head.section.renderNode.element;
            
            let offset = this.$(currentNode).position();
            let editorOffset = $editor.offset();
            
            button.css('top', offset.top + $editor.scrollTop() - editorOffset.top - 5);
            if(currentNode.tagName.toLowerCase()==='li') {
                button.css('left', this.$(currentNode.parentNode).position().left + $editor.scrollLeft() - 90);
            } else {
                button.css('left', offset.left + $editor.scrollLeft() - 90);
            }
        });
    },
   
    actions: {
        openMenu: function() {
            let menu = this.$('.gh-cardmenu');
            let button = this.$('#gh-cardmenu-button');
            this.set('isOpen', true);
            menu.css('display', 'flex');
            menu.css('top', button.css('top'));
            menu.css('left', button.css('left') + button.width());
        },
        closeMenu: function() {
            this.$('.gh-cardmenu').hide();
        }
    }
});

