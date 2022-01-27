import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

@classic
export default class ModalUpgradeUnsuspendUserHostLimit extends ModalComponent {
    @service
    router;

    @action
    upgrade() {
        this.router.transitionTo('pro');
    }

    @action
    confirm() {
        this.send('upgrade');
    }
}
