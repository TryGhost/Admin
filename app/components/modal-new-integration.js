import ModalComponent from 'ghost-admin/components/modal-base';
import {alias} from '@ember/object/computed';
import {A as emberA} from '@ember/array';
import {isInvalidError} from 'ember-ajax/errors';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    confirm() {},

    integration: alias('model'),

    actions: {
        updateName(name) {
            this.integration.set('name', name);
            this.integration.set('hasValidated', emberA());
            this.integration.errors.clear();
        },

        confirm() {
            return this.createIntegration.perform();
        }
    },

    createIntegration: task(function* () {
        try {
            yield this.confirm();
            this.send('closeModal');
        } catch (error) {
            // TODO: server-side validation errors should be serialized
            // properly so that errors are added to model.errors automatically
            if (error && isInvalidError(error)) {
                let [firstError] = error.payload.errors;
                let {message} = firstError;

                if (message && message.match(/name/i)) {
                    this.get('integration.errors').add('name', message);
                    this.get('integration.hasValidated').pushObject('name');
                    return;
                }
            }

            // should bubble up to the global error handler
            if (error) {
                throw error;
            }
        }
    }).drop()
});
