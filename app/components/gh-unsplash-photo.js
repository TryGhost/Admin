import Component from 'ember-component';
import {computed} from '@ember/object';
import {htmlSafe} from '@ember/string';

export default Component.extend({

    height: 0,
    photo: null,
    tagName: '',
    width: 1200,
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

    imageUrl: computed('photo.urls.regular', function () {
        let url = this.get('photo.urls.regular');

        url = url.replace(/&w=1080/, '&w=1200');

        return url;
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

        zoom(event) {
            // only zoom when it wasn't one of the child links clicked
            if (!event.target.matches('a') && event.target.closest('a').classList.contains('gh-unsplash-photo')) {
                event.preventDefault();
                this.zoom(this.get('photo'));
            }

            // don't propagate otherwise we can trigger the closeZoom action on the overlay
            event.stopPropagation();
        }
    }

});
