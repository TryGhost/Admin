import Component from '@ember/component';
import {inject as service} from '@ember/service';

export default Component.extend({
    upgrades: service(),

    tagName: '',
    version: '0.0.0',

    didInsertElement() {
        this._super(...arguments);
        this.get('upgrades.check').perform(this.get('version'));
    }
});
