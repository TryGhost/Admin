import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteMembers extends ModalComponent {
    confirmed = false;
    response = null;
    error = null;

    // Allowed actions
    confirm = () => {};

    @action
    confirm() {
        this.deleteMembersTask.perform();
    }

    @(task(function* () {
        try {
            this.set('response', (yield this.confirm()));
            this.set('confirmed', true);
        } catch (e) {
            if (e.payload?.errors) {
                this.set('confirmed', true);
                this.set('error', e.payload.errors[0].message);
            }

            throw e;
        }
    }).drop())
    deleteMembersTask;
}
