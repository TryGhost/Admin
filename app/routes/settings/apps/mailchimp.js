import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';

export default AuthenticatedRoute.extend(styleBody, {
    titleToken: 'Settings - Apps - MailChimp',

    classNames: ['settings-view-apps-mailchimp'],

    setupController(controller) {
        this._super(...arguments);

        // reset previous sync results when transitioning to mailchimp route
        controller.set('syncResults', {});

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
