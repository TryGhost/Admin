import Component from 'ember-component';
import layout from '../templates/components/koenig-menu-item';

export default Component.extend({
    layout,
    tagName: 'div',
    classNames: ['gh-cardmenu-card'],
    init() {
        this._super(...arguments);
    },
    click: function() {
        let {section, startOffset, endOffset} = this.get('range');
        let selection = window.getSelection();

        selection.removeAllRanges();

        let range = document.createRange();

        range.setStart(section.renderNode.element, 0);//startOffset-1); // todo
        range.setEnd(section.renderNode.element, 0);//endOffset-1);

        selection.addRange(range);
        
        this.get('tool').onClick(this.get('editor'), section);
        this.sendAction('clicked');     
    }
});
