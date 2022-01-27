import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {task} from 'ember-concurrency';

@classic
export default class ModalTransferOwner extends ModalComponent {
    user = null;

    // Allowed actions
    confirm = () => {};

    @action
    confirm() {
        this.transferOwnership.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } finally {
            this.send('closeModal');
        }
    }).drop())
    transferOwnership;
}
