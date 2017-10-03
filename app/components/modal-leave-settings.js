import ModalComponent from 'ghost-admin/components/modal-base';
import {invokeAction} from 'ember-invoke-action';

export default ModalComponent.extend({
    actions: {
        confirm() {
            invokeAction(this, 'confirm').finally(() => {
                this.send('closeModal');
            });
        }
    }
});
