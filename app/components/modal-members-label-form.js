import ModalComponent from 'ghost-admin/components/modal-base';
import {resetQueryParams} from 'ghost-admin/helpers/reset-query-params';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    router: service(),
    notifications: service(),
    model: null,
    showDeleteLabelModal: false,

    confirm() {},
    init() {
        this._super(...arguments);
    },

    actions: {
        toggleDeleteLabelModal() {
            this.toggleProperty('showDeleteLabelModal');
        }
    },

    saveTask: task(function* () {
        try {
            let label = yield this.model.save();
            this.notifications.showNotification('Label saved'.htmlSafe());
            this.send('closeModal');
            return label;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'label.save'});
            }
        }
    }),

    deleteLabel: task(function * () {
        try {
            yield this.model.destroyRecord();
            let routeName = this.router.currentRouteName;
            this.send('closeModal');
            this.router.transitionTo(routeName, {queryParams: resetQueryParams(routeName)});
        } catch (error) {
            if (error) {
                return this.notifications.showAPIError(error, {key: 'label.delete'});
            }
        }
    })
});