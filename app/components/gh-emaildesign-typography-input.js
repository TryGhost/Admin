import Component from '@ember/component';
import {inject as service} from '@ember/service';

const TYPOGRAPHY_OPTIONS = [
    {label: 'Sans-serif', name: 'sans-serif'},
    {label: 'Serif', name: 'serif'}
];

export default Component.extend({

    settings: service(),

    // public attrs
    post: null,

    init() {
        this._super(...arguments);
        this.availableTypographyOptions = TYPOGRAPHY_OPTIONS;
    },

    actions: {
        updateTypography(newTypographyValue) {
            
            // this.post.set('visibility', newVisibility);
        }
    }
});
