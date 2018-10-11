import Controller from '@ember/controller';
import {alias} from '@ember/object/computed';
import {task} from 'ember-concurrency';

export default Controller.extend({
    integration: alias('model'),

    actions: {
        save() {
            return this.save.perform();
        }
    },

    save: task(function* () {
        return yield this.integration.save();
    })
});
