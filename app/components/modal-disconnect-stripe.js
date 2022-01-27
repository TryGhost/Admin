import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {task} from 'ember-concurrency';

@classic
export default class ModalDisconnectStripe extends ModalComponent {
    // Allowed actions
    confirm = () => {};

    @alias('model.stripeConnectAccountName')
    stripeConnectAccountName;

    @action
    confirm() {
        this.disconnectStripe.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } finally {
            this.send('closeModal');
        }
    }).drop())
    disconnectStripe;
}
