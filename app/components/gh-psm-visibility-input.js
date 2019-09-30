import Component from '@ember/component';

const VISIBILITIES = [
    {label: 'Everyone', name: 'public'},
    {label: 'Free & Paying Members', name: 'members'},
    {label: 'Paying Members', name: 'paid'}
];

export default Component.extend({

    // public attrs
    post: null,

    init() {
        this._super(...arguments);
        this.availableVisibilities = VISIBILITIES;
    },

    actions: {
        updateVisibility(newVisibility) {
            this.post.set('visibility', newVisibility);
        }
    }
});
