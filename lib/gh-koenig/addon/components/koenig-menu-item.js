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
        this.get('tool').onClick(this.get('editor'));
        this.sendAction('clicked');

    }
});
