import Component from '@ember/component';
import {inject as service} from '@ember/service';

export default Component.extend({
    settings: service(),

    showPortalSettings: false,
    showLeaveSettingsModal: false,
    
    actions: {
        openStripeSettings() {
            this.set('membersStripeOpen', true);
        },
        closePortalSettings() {
            const changedAttributes = this.settings.changedAttributes();
            if (changedAttributes && Object.keys(changedAttributes).length > 0) {
                this.set('showLeaveSettingsModal', true);
            } else {
                this.set('showPortalSettings', false);
            }
        },
        closeLeaveSettingsModal() {
            this.set('showLeaveSettingsModal', false);
        },

        leavePortalSettings() {
            this.settings.rollbackAttributes();
            this.set('showPortalSettings', false);
            this.set('showLeaveSettingsModal', false);
        }
    }
});