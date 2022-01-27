import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteWebhook extends ModalComponent {
    @service
    notifications;

    @alias('model')
    webhook;

    @action
    confirm() {
        this.deleteWebhook.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'webhook.delete.failed'});
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteWebhook;
}
