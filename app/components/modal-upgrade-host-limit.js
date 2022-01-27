import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action, computed} from '@ember/object';
import {inject as service} from '@ember/service';

@classic
export default class ModalUpgradeHostLimit extends ModalComponent {
    @service
    router;

    @service
    billing;

    @computed('details')
    get headerMessage() {
        let header = 'Upgrade to enable publishing';

        if (this.model.message && this.model.message.match(/account is currently in review/gi)) {
            header = `Hold up, we're missing some details`;
        }

        return header;
    }

    @computed('details')
    get upgradeMessage() {
        const {limit, total} = this.model.details || {};
        const message = this.model.message;

        return {limit, total, message};
    }

    @action
    upgrade() {
        this.router.transitionTo('pro', {queryParams: {action: 'checkout'}});
    }

    @action
    confirm() {
        this.send('upgrade');
    }
}
