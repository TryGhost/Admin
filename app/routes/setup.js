import Route from '@ember/routing/route';
import {inject as service} from '@ember/service';

export default Route.extend({
    ghostPaths: service(),
    session: service(),
    ajax: service(),
    config: service(),

    // use the beforeModel hook to check to see whether or not setup has been
    // previously completed.  If it has, stop the transition into the setup page.
    beforeModel() {
        this._super(...arguments);

        if (this.get('session.isAuthenticated')) {
            return this.transitionTo('home');
        }

        let authUrl = this.get('ghostPaths.url').api('authentication', 'setup');

        // check the state of the setup process via the API
        return this.ajax.request(authUrl)
            .then((result) => {
                let [setup] = result.setup;

                if (setup.status) {
                    return this.transitionTo('signin');
                } else {
                    let controller = this.controllerFor('setup/two');
                    if (setup.title) {
                        controller.set('blogTitle', setup.title.replace(/&apos;/gim, '\''));
                    }

                    if (setup.name) {
                        controller.set('name', setup.name.replace(/&apos;/gim, '\''));
                    }

                    if (setup.email) {
                        controller.set('email', setup.email);
                    }
                }
            });
    },

    deactivate() {
        this._super(...arguments);
        this.controllerFor('setup/two').set('password', '');
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Setup',
            bodyClasses: ['unauthenticated-route'],
            mainClasses: ['gh-main-white']
        };
    }
});
