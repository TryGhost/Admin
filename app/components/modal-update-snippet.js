import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalUpdateSnippet extends ModalComponent {
    @service
    router;

    @service
    notifications;

    @alias('model.snippetRecord')
    snippet;

    @action
    confirm() {
        this.updateSnippet.perform();
    }

    @(task(function* () {
        try {
            yield this.confirm();
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'snippet.update.failed'});
        } finally {
            this.send('closeModal');
        }
    }).drop())
    updateSnippet;
}
