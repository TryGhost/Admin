/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import {action} from '@ember/object';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Controller.extend({
    ajax: service(),
    config: service(),
    customViews: service(),
    dropdown: service(),
    ghostPaths: service(),
    router: service(),
    session: service(),
    settings: service(),
    ui: service(),

    updateUrl: computed.reads('config.updateUrl'),
    showBilling: computed.reads('config.billingUrl'),
    showNavMenu: computed('router.currentRouteName', 'session.{isAuthenticated,user.isFulfilled}', 'ui.isFullScreen', function () {
        let {router, session, ui} = this;

        // if we're in fullscreen mode don't show the nav menu
        if (ui.isFullScreen) {
            return false;
        }

        // we need to defer showing the navigation menu until the session.user
        // promise has fulfilled so that gh-user-can-admin has the correct data
        if (!session.isAuthenticated || !session.user.isFulfilled) {
            return false;
        }

        return (router.currentRouteName !== 'error404' || session.isAuthenticated)
                && !router.currentRouteName.match(/(signin|signup|setup|reset)/);
    }),

    openUpdateTab: action(function (event) {
        event.preventDefault();
        const updateWindow = window.open('', '_blank');

        updateWindow.document.write('Loading...');

        const updateUrl = new URL(this.config.get('updateUrl'));
        const ghostIdentityUrl = this.ghostPaths.url.api('identities');

        this.ajax.request(ghostIdentityUrl).then((response) => {
            const token = response && response.identities && response.identities[0] && response.identities[0].token;
            updateUrl.searchParams.append('jwt', token);
            updateWindow.location.href = updateUrl.toString();
        });
    })
});
