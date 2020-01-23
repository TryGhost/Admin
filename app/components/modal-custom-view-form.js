import ModalComponent from 'ghost-admin/components/modal-base';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    customViews: service(),

    confirm() {},

    init() {
        this._super(...arguments);
        this.set('model', this.customViews.editView());
    },

    actions: {
        confirm() {
            return this.saveTask.perform();
        }
    },

    saveTask: task(function* () {
        let view = yield this.customViews.saveViewTask.perform(this.model);
        this.send('closeModal');
        return view;
    }),

    deleteTask: task(function* () {
        let view = yield this.customViews.deleteViewTask.perform(this.model);
        this.send('closeModal');
        return view;
    })
});
