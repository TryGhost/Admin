import ModalComponent from 'ghost-admin/components/modal-base';
import {resetQueryParams} from 'ghost-admin/helpers/reset-query-params';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    router: service(),
    notifications: service(),
    model: null,

    confirm() {},
    init() {
        this._super(...arguments);
        // this.set('model', this.customViews.editView());
    },

    actions: {
        confirm() {
            return this.saveTask.perform();
        },
        delete() {
            return this.model.destroyRecord().then(() => {
                let routeName = this.router.currentRouteName;
                this.send('closeModal');
                this.router.transitionTo(routeName, {queryParams: resetQueryParams(routeName)});
            }, (error) => {
                return this.notifications.showAPIError(error, {key: 'label.delete'});
            });
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
    })
});