import Ember from 'ember';
import {invokeAction} from 'ember-invoke-action';

const {
    inject: {service}
} = Ember;

export default Ember.Component.extend({
    feature: service(),

    willDestroyElement() {
        this._super(...arguments);

        if (this.get('tag.isDeleted') && this.get('onDelete')) {
            invokeAction(this, 'onDelete');
        }
    }
});
