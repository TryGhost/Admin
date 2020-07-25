import ModalComponent from 'ghost-admin/components/modal-base';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    store: service(),

    completed: false,
    response: null,
    error: null,

    // Allowed actions
    confirm: () => {},

    actions: {
        confirm() {
            return this.deleteMembersTask.perform();
        },

        countPaidMembers() {
            return this.countPaidMembersTask.perform();
        }
    },

    deleteMembersTask: task(function* () {
        try {
            let response = yield this.confirm();

            if (!response?.invalid || response?.invalid?.count === 0) {
                return this.closeModal();
            }

            this.set('response', response);
            this.set('completed', true);
        } catch (e) {
            if (e.payload && e.payload.errors) {
                this.set('completed', true);
                this.set('error', e.payload.errors[0].message);
            }

            throw e;
        }
    }).drop(),

    countPaidMembersTask: task(function* () {
        const query = Object.assign({}, this.model.filterQuery, {paid: true, limit: 1, page: 1});
        const result = yield this.store.query('member', query);
        this.set('paidMemberCount', result.meta.pagination.total);
    })
});
