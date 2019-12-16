import ModalComponent from 'ghost-admin/components/modal-base';
import {inject as service} from '@ember/service';

export default ModalComponent.extend({
    session: service(),
    actions: {
        upgrade: function () {
            const upgradeLink = this.model.upgradeLink;
            window.open(upgradeLink);
            this.closeModal();
            return true;
        }
    }
});
