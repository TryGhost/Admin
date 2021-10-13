import PostsController from './posts';

/* eslint-disable ghost/ember/alias-model-in-controller */
export default PostsController.extend({
    init() {
        this._super(...arguments);

        const TYPES = [{
            name: this.intl.t('Manual.JS.All pages'),
            value: null
        }, {
            name: this.intl.t('Manual.JS.Draft pages'),
            value: 'draft'
        }, {
            name: this.intl.t('Manual.JS.Published pages'),
            value: 'published'
        }, {
            name: this.intl.t('Manual.JS.Scheduled pages'),
            value: 'scheduled'
        }, {
            name: this.intl.t('Manual.JS.Featured pages'),
            value: 'featured'
        }];

        const ORDERS = [{
            name: this.intl.t('Manual.JS.Newest'),
            value: null
        }, {
            name: this.intl.t('Manual.JS.Oldest'),
            value: 'published_at asc'
        }, {
            name: this.intl.t('Manual.JS.Recently updated'),
            value: 'updated_at desc'
        }];

        this.availableTypes = TYPES;
        this.availableOrders = ORDERS;
    },

    actions: {
        openEditor(page) {
            this.transitionToRoute('editor.edit', 'page', page.get('id'));
        }
    }
});
