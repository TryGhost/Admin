import AdminRoute from 'ghost-admin/routes/admin';
import {inject as service} from '@ember/service';

export default AdminRoute.extend({
    notifications: service(),
    settings: service(),

    beforeModel(transition) {
        this._super(...arguments);

        if (transition.to.queryParams?.fromAddressUpdate === 'success') {
            this.notifications.showAlert(
                `Newsletter email address has been updated`,
                {type: 'success', key: 'members.settings.from-address.updated'}
            );
        } else if (transition.to.queryParams?.supportAddressUpdate === 'success') {
            this.notifications.showAlert(
                `Support email address has been updated`,
                {type: 'success', key: 'members.settings.support-address.updated'}
            );
        }
    },

    model() {
        return this.settings.reload();
    },

    setupController(controller) {
        controller.resetEmailAddresses();
    },

    actions: {
        willTransition(transition) {
            return this.controller.leaveRoute(transition);
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Settings - Members'
        };
    }
});
