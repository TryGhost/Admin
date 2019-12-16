import ModalComponent from 'ghost-admin/components/modal-base';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default ModalComponent.extend({
    session: service(),
    upgradeMessage: computed('details', function () {
        const errorDetails = this.model.details;
        return {
            limit: errorDetails.limit,
            total: errorDetails.attempted
        };
    }),
    actions: {
        upgrade: function () {
            const upgradeLink = this.model.upgradeLink;
            window.open(upgradeLink);
            this.closeModal();
            return true;
        }
    }
});
