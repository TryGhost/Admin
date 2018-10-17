import ModalComponent from 'ghost-admin/components/modal-base';
import Webhook from 'ghost-admin/models/webhook';
import {alias} from '@ember/object/computed';
import {isInvalidError} from 'ember-ajax/errors';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    router: service(),

    confirm() {},

    webhook: alias('model'),

    actions: {
        updateAttr(event) {
            let {name, value} = event.target;
            this.webhook.set(name, value);
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
            // TODO: server-side validation errors should be serialized
            // properly so that errors are added to model.errors automatically
            if (error && isInvalidError(error)) {
                let attrs = Array.from(Webhook.attributes.keys());

                error.payload.errors.forEach((error) => {
                    let {message, property} = error;

                    if (property && attrs.includes(property)) {
                        this.webhook.errors.add(property, message);
                        this.webhook.hasValidated.pushObject(property);
                    }
                });

                return;
            }

            // bubble up to the global error handler
            if (error) {
                throw error;
            }
        }
    })
});
