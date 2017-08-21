import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';

export default AuthenticatedRoute.extend(styleBody, {
    titleToken: 'Settings - Apps - MailChimp',

    classNames: ['settings-view-apps-mailchimp'],

    setupController(controller) {
        this._super(...arguments);

        // start fetching lists asynchronously - UI will disable the select
        // and show a spinner until it's finished
        controller.get('fetchLists').perform();
    },

    actions: {
        save() {
            this.get('controller').send('save');
        }
    }
});
