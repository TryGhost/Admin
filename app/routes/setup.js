import Route from 'ember-route';
import injectService from 'ember-service/inject';
import styleBody from 'ghost-admin/mixins/style-body';
import {isBlank} from 'ember-utils';

export default Route.extend(styleBody, {
    titleToken: 'Setup',

    classNames: ['ghost-setup'],

    ghostPaths: injectService(),
    session: injectService(),
    ajax: injectService(),
    config: injectService(),

    // use the beforeModel hook to check to see whether or not setup has been
    // previously completed.  If it has, stop the transition into the setup page.
    beforeModel() {
        this._super(...arguments);

        // with OAuth auth users are authenticated on step 2 so we
        // can't use the session.isAuthenticated shortcut
        if (!this.get('config.ghostOAuth') && this.get('session.isAuthenticated')) {
            this.transitionTo('posts');
            return;
        }

        // After ghost.org signup we get redirected to setup/three with a
        // one-time, short expiry token in order to finish the signup flow.
        // Grab the token here, exchange it for a full token set and allow
        // setup to continue
        let [, token] = window.location.search.match(/token=(.*)/) || [];

        if (!isBlank(token)) {
            let tokenExchangeUrl = this.get('ghostPaths.url')
                .api('authentication', 'setup', 'three');

            // simulate a completed step 2 and skip other setup bits
            this.controllerFor('setup.two').set('blogCreated', true);

            /* eslint-disable camelcase */
            return this.get('ajax')
                .post(tokenExchangeUrl, {data: {
                    token,
                    client_id: this.get('config.clientId'),
                    client_secret: this.get('config.clientSecret')
                }}).then((data) => {
                    let now = (new Date()).getTime();

                    delete data.errors;
                    data.authenticator = 'authenticator:oauth2';
                    data.token_type = 'Bearer';
                    // server returns seconds, ESA stores expiry in ms
                    data.expires_at = new Date(now + data.expires_in * 1000).getTime();

                    this.get('session.session.store').persist({authenticated: data});
                    this.get('session.session').restore();
                }).catch(() => {
                    return this.transitionTo('signin');
                });
            /* eslint-enable camelcase */
        }

        let authUrl = this.get('ghostPaths.url').api('authentication', 'setup');

        // check the state of the setup process via the API
        return this.get('ajax').request(authUrl)
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
    }
});
