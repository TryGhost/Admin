import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action, computed} from '@ember/object';
import {alias, reads} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteMember extends ModalComponent {
    @service
    membersStats;

    shouldCancelSubscriptions = false;

    // Allowed actions
    confirm = () => {};

    @alias('model')
    member;

    @reads('shouldCancelSubscriptions')
    cancelSubscriptions;

    @computed('member')
    get hasActiveStripeSubscriptions() {
        let subscriptions = this.member.get('subscriptions');

        if (!subscriptions || subscriptions.length === 0) {
            return false;
        }

        let firstActiveStripeSubscription = subscriptions.find((subscription) => {
            return ['active', 'trialing', 'unpaid', 'past_due'].includes(subscription.status);
        });

        return firstActiveStripeSubscription !== undefined;
    }

    @action
    confirm() {
        this.deleteMember.perform();
    }

    @action
    toggleShouldCancelSubscriptions() {
        this.set('shouldCancelSubscriptions', !this.shouldCancelSubscriptions);
    }

    @(task(function* () {
        try {
            yield this.confirm(this.shouldCancelSubscriptions);
            this.membersStats.invalidate();
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteMember;
}
