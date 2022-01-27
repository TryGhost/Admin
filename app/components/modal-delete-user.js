import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteUser extends ModalComponent {
    // Allowed actions
    confirm = () => {};

    @alias('model')
    user;

    @action
    confirm() {
        this.deleteUser.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteUser;
}
