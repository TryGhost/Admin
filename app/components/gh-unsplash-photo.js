import Component from 'ember-component';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';

export default Component.extend({

    height: 0,
    photo: null,
    tagName: '',
    width: 1080,

    // closure actions
    insert() {},

    // avoid "binding style attributes" warnings
    style: computed('photo.color', function() {
        let styles = [];
        let ratio = this.get('photo.ratio');

        styles.push(`background-color: ${this.get('photo.color')}`);
        styles.push(`padding-bottom: ${ratio * 100}%`);

        return htmlSafe(styles.join('; '));
    }),

    didReceiveAttrs() {
        this._super(...arguments);

        let height = this.get('width') * this.get('photo.ratio');

        this.set('height', height);
    },

    actions: {
        insert() {
            this.insert(this.get('photo'));
        }
    }

});
