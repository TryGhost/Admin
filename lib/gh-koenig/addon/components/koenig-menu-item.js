import Component from 'ember-component';
import layout from '../templates/components/koenig-menu-item';

export default Component.extend({
    layout,
    tagName: 'div',
    classNames: ['gh-cardmenu-card'],
    classNameBindings: ['selected'],
    init() {
        this._super(...arguments);
        this.set('selected', this.get('tool').selected);
    },
    click: () => {
        let {section} = this.get('range');
        let selection = window.getSelection();

        selection.removeAllRanges();

        let range = document.createRange();

        range.setStart(section.renderNode.element, 0);
        range.setEnd(section.renderNode.element, 0);

        selection.addRange(range);

        this.get('tool').onClick(this.get('editor'), section);
        this.sendAction('clicked');
    }
});
