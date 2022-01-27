import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteIntegration extends ModalComponent {
    @service
    router;

    @service
    feature;

    @service
    notifications;

    @alias('model')
    integration;

    @action
    confirm() {
        this.deleteIntegration.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
            this.router.transitionTo('settings.integrations');
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'integration.delete.failed'});
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteIntegration;
}
