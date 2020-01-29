/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Controller.extend({
    customViews: service(),
    dropdown: service(),
    router: service(),
    session: service(),
    settings: service(),
    ui: service(),

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
    })
});
