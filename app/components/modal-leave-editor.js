import ModalComponent from 'ghost-admin/components/modal-base';
import RSVP from 'rsvp';

export default ModalComponent.extend({
    actions: {
        save() {
            let save = this.get('model.save') || RSVP.resolve();
            return save();
        },

        discard() {
            let discard = this.get('model.discard') || RSVP.resolve();
            return discard();
        }
    },

    // Allowed actions
    confirm: () => RSVP.resolve()
});
