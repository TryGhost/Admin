import Component from 'ember-component';
import computed from 'ember-computed';
import run from 'ember-runloop';
import $ from 'jquery';
import Tools from '../options/default-tools';
import layout from '../templates/components/koenig-slash-menu';

export default Component.extend({
    layout,
    isOpen: false,
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
        this.set('tools', new Tools(this.get('editor'), this));
        let self = this;
        this.get('editor').onTextInput({
            name: 'slash_menu',
            text: '/',
            run(editor) {
                self.open(editor);
            }
        });
    },

    willDestroy() {

    },

    didRender() {
        let editor = this.get('editor');
        let $editor = $('.gh-editor-container');
        
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
            this.set('isOpen', false);
        },
        updateSelection: function(event) {
            alert(event);
        }
    }
});




// import Component from 'ember-component';
// import computed from 'ember-computed';
// import run from 'ember-runloop';
// import $ from 'jquery';
// import Tools from '../options/default-tools';
// import layout from '../templates/components/koenig-slash-menu';

// export default Component.extend({
//     layout,
//     range: null,
//     menuSelectedItem: 0,
//     toolsLength: 0,
//     selectedTool: null,
//     isActive: false,
//     isInputting: false,
//     isSetup: false,
//     query: '',
//    toolbar: computed('query', 'range', 'selectedItem', function () {
//         let tools = [];
//         let match = (this.query || '').trim().toLowerCase();
//         let selected = this.get('selectedItem');
//         let i = 0;
//         // todo cache active tools so we don't need to loop through them on selection change.
//         this.tools.forEach((tool) => {
//             if ((tool.type === 'block' || tool.type === 'card') && tool.cardMenu === true && (tool.label.toLowerCase().startsWith(match) || tool.name.toLowerCase().startsWith(match))) {
//                 let t = {
//                     label: tool.label,
//                     name: tool.name,
//                     icon: tool.icon,
//                     onClick: tool.onClick,
//                     range: this.get('range'),
//                     order: tool.order,
//                     selected: false
//                 };

//                 if (i === selected) {
//                     this.set('selectedTool', t);
//                     t.selected = true;
//                 }

//                 tools.push(t);
//                 i++;
//             }
//         });
//         this.set('toolsLength', i);
//         tools.sort((a, b) => a.order > b.order);
//         console.log(tools);
//         return tools;
//     }),

//     init() {
//         this._super(...arguments);
//         this.tools = new Tools(this.get('editor'), this);
//         this.iconURL = `${this.get('assetPath')}/tools/`;

//         this.editor.cursorDidChange(this.cursorChange.bind(this));
//         let self = this;
//         this.editor.onTextInput({
//             name: 'slash_menu',
//             text: '/',
//             run(editor) {
//                 self.open(editor);
//             }
//         });
//     },

//     cursorChange() {
//         if (!this.editor.range.isCollapsed || this.editor.range.head.section !== this._node || this.editor.range.head.offset < 1 || !this.editor.range.head.section) {
//             this.close();
//         }

//         if (this.isActive && this.isInputting) {
//             this.query = this.editor.range.head.section.text.substring(this._offset, this.editor.range.head.offset);
//             this.set('range', {
//                 section: this._node,
//                 startOffset: this._offset,
//                 endOffset: this.editor.range.head.offset
//             });
//             this.propertyDidChange('toolbar');
//         }
//     },

//     didRender() {
//         if (!this.isSetup) {
//             this.$('.koenig-menu-button').onClick = () => {
//                 alert('CLICK');
//             };
//             this.isSetup = true;
//         }
//     },

//     /**
//      *
//      * @param {*} editor
//      * @param {*} notInputting is true if the user isn't typing to filter, this occurs
//      * if the menu is oppened via pressing + rather than typing in /
//      */
//     open(editor, notInputting) {
//         let self = this;
//         let $this = this.$('.koenig-menu');
//         let $editor = $('.gh-editor-container');

//         this._node = editor.range.head.section;
//         this._offset = editor.range.head.offset;
//         this.isActive = true;
//         this.isInputting = !notInputting;
//         this.cursorChange();
//         let range = window.getSelection().getRangeAt(0); // get the actual range within the DOM.

//         let position =  range.getBoundingClientRect();
//         let edOffset = $editor.offset();

//         $this.show();

//         run.schedule('afterRender', this, () => {
//             $this.css('top', position.top + $editor.scrollTop() - edOffset.top + 20); // - edOffset.top+10
//             $this.css('left', position.left + (position.width / 2) + $editor.scrollLeft() - edOffset.left);
//         });

//         this.query = '';
//         this.propertyDidChange('toolbar');

//         let downKeyCommand = {
//             str: 'DOWN',
//             _ghostName: 'slashdown',
//             run() {
//                 let item = self.get('menuSelectedItem');
//                 if (item < self.get('toolsLength') - 1) {
//                     self.set('menuSelectedItem', item + 1);
//                     self.propertyDidChange('toolbar');
//                 }
//             }
//         };
//         editor.registerKeyCommand(downKeyCommand);

//         let upKeyCommand = {
//             str: 'UP',
//             _ghostName: 'slashup',
//             run() {
//                 let item = self.get('menuSelectedItem');
//                 if (item > 0) {
//                     self.set('menuSelectedItem', item - 1);
//                     self.propertyDidChange('toolbar');
//                 }
//             }
//         };
//         editor.registerKeyCommand(upKeyCommand);

//         let enterKeyCommand = {
//             str: 'ENTER',
//             _ghostName: 'slashdown',
//             run(postEditor) {

//                 let {range} = postEditor;

//                 range.head.offset = self._offset - 1;
//                 postEditor.deleteRange(range);
//                 self.get('selectedTool').onClick(self.get('editor'));
//                 self.close();
//             }
//         };
//         editor.registerKeyCommand(enterKeyCommand);

//         let escapeKeyCommand = {
//             str: 'ESC',
//             _ghostName: 'slashesc',
//             run() {
//                 self.close();
//             }
//         };
//         editor.registerKeyCommand(escapeKeyCommand);
//     },

//     close() {
//         this.isActive = false;
//         this.isInputting = false;
//         this.$('.koenig-menu').hide();
//         // note: below is using a mobiledoc Private API.
//         // there is no way to unregister a keycommand when it's registered so we have to remove it ourselves.
//         // edit: I've put a PR in place and there is now a public API to remove, will add when released.
//         for (let i = this.editor._keyCommands.length - 1; i > -1; i--) {
//             let keyCommand = this.editor._keyCommands[i];

//             if (keyCommand._ghostName === 'slashdown' || keyCommand._ghostName === 'slashup' || keyCommand._ghostName === 'slashenter' || keyCommand._ghostName === 'slashesc') {
//                 this.editor._keyCommands.splice(i, 1);
//             }
//         }
//         return;
//     }
// });
