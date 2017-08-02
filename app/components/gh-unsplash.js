import Component from 'ember-component';
import injectService from 'ember-service/inject';

export default Component.extend({
    unsplash: injectService(),

    tagName: '',

    didInsertElement() {
        this._super(...arguments);
        this.get('unsplash').listNew();
    }
});
