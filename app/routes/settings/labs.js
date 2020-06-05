import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import CurrentUserSettings from 'ghost-admin/mixins/current-user-settings';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend(CurrentUserSettings, {
    settings: service(),
    notifications: service(),
    queryParams: {
        fromAddressUpdate: {
            replace: true
        }
    },

    beforeModel() {
        this._super(...arguments);
        return this.get('session.user')
            .then(this.transitionAuthor())
            .then(this.transitionEditor());
    },

    model() {
        return this.settings.reload();
    },

    setupController(controller) {
        if (controller.fromAddressUpdate === 'success') {
            this.notifications.showAlert(
                `Members "From Address" was updated successfully`.htmlSafe(),
                {type: 'success', key: 'members.settings.from-address.updated'}
            );
        }
    },

    resetController(controller, isExiting) {
        if (isExiting) {
            controller.reset();
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Settings - Labs'
        };
    }
});
