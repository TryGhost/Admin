import ModalComponent from 'ghost-admin/components/modal-base';
import Webhook from 'ghost-admin/models/webhook';
import classic from 'ember-classic-decorator';
import {AVAILABLE_EVENTS} from 'ghost-admin/helpers/event-name';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {camelize} from '@ember/string';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalWebhookForm extends ModalComponent {
    @service
    router;

    @service
    feature;

    availableEvents = null;
    error = null;
    buttonText = 'Save';
    successText = 'Saved';
    confirm() {}

    @alias('model')
    webhook;

    init() {
        super.init(...arguments);
        this.availableEvents = AVAILABLE_EVENTS;
    }

    didReceiveAttrs() {
        super.didReceiveAttrs(...arguments);
        if (this.webhook.isNew) {
            this.set('buttonText', 'Create');
            this.set('successText', 'Created');
        }
    }

    @action
    selectEvent(value) {
        this.webhook.set('event', value);
        this.webhook.validate({property: 'event'});
    }

    @action
    confirm() {
        this.saveWebhook.perform();
    }

    @task(function* () {
        this.set('error', null);

        try {
            let webhook = yield this.confirm();
            let integration = yield webhook.get('integration');
            this.router.transitionTo('settings.integration', integration);
        } catch (e) {
            // TODO: server-side validation errors should be serialized
            // properly so that errors are added to model.errors automatically
            if (e && e.payload && e.payload.errors) {
                let attrs = Array.from(Webhook.attributes.keys());

                e.payload.errors.forEach((error) => {
                    let {message, property = ''} = error;
                    property = camelize(property);

                    if (property && attrs.includes(property)) {
                        this.webhook.errors.add(property, message);
                        this.webhook.hasValidated.pushObject(property);
                    } else {
                        this.set('error', `Error: ${message}`);
                    }
                });

                return;
            }

            // bubble up to the global error handler
            if (e) {
                throw e;
            }
        }
    })
    saveWebhook;
}
