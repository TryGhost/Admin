import ModalComponent from 'ghost-admin/components/modal-base';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({

    model: null,

    confirm() {},
    init() {
        this._super(...arguments);
        // this.set('model', this.customViews.editView());
    },

    actions: {
        confirm() {
            return this.saveTask.perform();
        }
    },

    saveTask: task(function* () {
        let label = yield this.model.save();
        this.send('closeModal');
        return label;
    }),

    deleteTask: task(function* () {
    //     let view = yield this.customViews.deleteViewTask.perform(this.model);
    //     this.send('closeModal');
    //     return view;
    })
});