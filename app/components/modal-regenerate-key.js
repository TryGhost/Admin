import ModalComponent from 'ghost-admin/components/modal-base';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    ajax: service(),
    ghostPaths: service(),
    // Allowed actions
    confirm: () => {},
    apiKey: alias('model.apiKey'),
    integration: alias('model.integration'),
    actions: {
        confirm() {
            this.regenerateApiKey.perform();
        }
    },
    regenerateKey: task(function* () {
        try {
            let url = this.get('ghostPaths.url').api('/integrations/', this.integration.id, 'api_key', this.apiKey.id, 'regenerate');
            try {
                yield this.ajax.put(url, {
                    data: {
                        integrations: [{id: this.integration.id}]
                    }
                });
                yield this.confirm();
            } catch (e) {
                // Show Error
            }
        } finally {
            this.send('closeModal');
        }
    }).drop()
});
