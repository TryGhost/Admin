import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalUnsubscribeMembers extends ModalComponent {
    @service
    membersStats;

    shouldCancelSubscriptions = false;

    // Allowed actions
    confirm = () => {};

    @alias('model')
    member;

    @action
    confirm() {
        this.unsubscribeMemberTask.perform();
    }

    @(task(function* () {
        try {
            const response = yield this.confirm();
            this.set('response', response);
            this.set('confirmed', true);
        } catch (e) {
            if (e.payload?.errors) {
                this.set('confirmed', true);
                this.set('error', e.payload.errors[0].message);
            }
            throw e;
        }
    }).drop())
    unsubscribeMemberTask;
}
