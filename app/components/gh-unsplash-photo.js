import Component from 'ember-component';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';

export default Component.extend({

    height: 0,
    photo: null,
    tagName: '',
    width: 1080,
    zoomed: false,

    // closure actions
    insert() {},
    zoom() {},

    // avoid "binding style attributes" warnings
    style: computed('photo.color', 'zoomed', function() {
        let styles = [];
        let ratio = this.get('photo.ratio');
        let zoomed = this.get('zoomed');

        styles.push(`background-color: ${this.get('photo.color')}`);

        if (!zoomed) {
            styles.push(`padding-bottom: ${ratio * 100}%`);
        }

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
        },

        zoom() {
            this.zoom(this.get('photo'));
        }
    }

});
