import ModalComponent from 'ghost-admin/components/modal-base';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default ModalComponent.extend({
    ajax: service(),
    ghostPaths: service(),
    // Allowed actions
    confirm: () => {},
    apiKey: alias('model'),
    actions: {
        confirm() {
            this.regenerateApiKey.perform();
        }
    },
    regenerateKey: task(function* () {
        try {
            let url = this.get('ghostPaths.url').api('/api_keys/', this.apiKey.id, 'regenerate');
            try {
                yield this.ajax.post(url);
                yield this.confirm();
            } catch (e) {
                // Show Error
            }
        } finally {
            this.send('closeModal');
        }
    }).drop()
});
