import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import styleBody from 'ghost-admin/mixins/style-body';
import injectService from 'ember-service/inject';

export default AuthenticatedRoute.extend(styleBody, {
    titleToken: 'Settings - Apps - Slack',

    store: injectService(),

    classNames: ['settings-view-apps-slack'],

    model() {
        return this.get('store').queryRecord('setting', {type: 'blog,theme,private'});
    },

    setupController(controller, model) {
        controller.set('model', model.get('slack.firstObject'));
        controller.set('settings', model);
    }
});
