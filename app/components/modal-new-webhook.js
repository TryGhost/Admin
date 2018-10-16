import ModalComponent from 'ghost-admin/components/modal-base';
import {alias} from '@ember/object/computed';
import {isInvalidError} from 'ember-ajax/errors';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    router: service(),

    confirm() {},

    webhook: alias('model'),

    actions: {
        updateAttr(attr) {
            console.log(...arguments);
        },

        confirm() {
            this.createWebhook.perform();
        }
    },

    createWebhook: task(function* () {
        try {
            let webhook = yield this.confirm();
            let integration = yield webhook.get('integration');
            console.log(integration);
            this.router.transitionTo('settings.integration', integration);
        } catch (error) {
            console.log(error);
            // TODO: server-side validation errors should be serialized
            // properly so that errors are added to model.errors automatically
            // if (error && isInvalidError(error)) {
            //     error.payload.errors.each((error) => {
            //         let {message} = error;

            //         if (message) {

            //         }
            //     });

            //     return;
            // }

            // bubble up to the global error handler
            if (error) {
                throw error;
            }
        }
    })
});
