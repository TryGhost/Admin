import ModalComponent from '@tryghost/admin/components/modal-base';

export default ModalComponent.extend({
    actions: {
        confirm() {
            this.confirm();
            this.send('closeModal');
        }
    }
});
