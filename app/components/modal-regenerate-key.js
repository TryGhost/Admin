import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {capitalize} from '@ember/string';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalRegenerateKey extends ModalComponent {
    @service
    ajax;

    @service
    store;

    @service
    ghostPaths;

    errorMessage = null;

    // Allowed actions
    confirm = () => {};

    @alias('model.apiKey')
    apiKey;

    @alias('model.integration')
    integration;

    @alias('model.internalIntegration')
    internalIntegration;

    @action
    confirm() {
        this.regenerateApiKey.perform();
    }

    @(task(function* () {
        let url = this.get('ghostPaths.url').api('/integrations/', this.integration.id, 'api_key', this.apiKey.id, 'refresh');
        try {
            const response = yield this.ajax.post(url, {
                data: {
                    integrations: [{id: this.integration.id}]
                }
            });
            this.store.pushPayload(response);
            yield this.confirm();
            this.send('closeModal');
        } catch (e) {
            let errMessage = `There was an error regenerating the ${capitalize(this.apiKey.type)} API Key. Please try again`;
            this.set('errorMessage', errMessage);
            return;
        }
    }).drop())
    regenerateKey;
}
