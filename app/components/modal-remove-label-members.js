import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias, not} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalRemoveLabelMembers extends ModalComponent {
    @service
    membersStats;

    selectedLabel = null;

    // Allowed actions
    confirm = () => {};

    @not('selectedLabel')
    isDisabled;

    @alias('model')
    member;

    @action
    confirm() {
        this.removeLabelTask.perform();
    }

    @action
    setLabel(label) {
        this.set('selectedLabel', label);
    }

    @(task(function* () {
        try {
            const response = yield this.confirm(this.selectedLabel);
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
    removeLabelTask;
}
