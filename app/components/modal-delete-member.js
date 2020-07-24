import ModalComponent from 'ghost-admin/components/modal-base';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    membersStats: service(),

    cancelSubscriptions: false,

    // Allowed actions
    confirm: () => {},

    member: alias('model'),

    hasActiveStripeSubscriptions: computed('member', function () {
        let subscriptions = this.member.get('stripe');

        if (!subscriptions || subscriptions.length === 0) {
            return false;
        }

        let firstActiveStripeSubscription = subscriptions.find((subscription) => {
            return subscription.status === 'active' || subscription.status === 'trialing';
        });

        return firstActiveStripeSubscription !== undefined;
    }),

    actions: {
        confirm() {
            this.deleteMember.perform();
        },

        toggleCancelSubscriptions() {
            this.cancelSubscriptions = !this.cancelSubscriptions;
        }
    },

    deleteMember: task(function* () {
        try {
            yield this.confirm(this.cancelSubscriptions);
            this.membersStats.invalidate();
        } finally {
            this.send('closeModal');
        }
    }).drop()
});
