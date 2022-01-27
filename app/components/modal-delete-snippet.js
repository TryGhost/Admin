import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteSnippet extends ModalComponent {
    @service
    router;

    @service
    notifications;

    @alias('model')
    snippet;

    @action
    confirm() {
        this.deleteSnippet.perform();
    }

    @(task(function* (snippet) {
        try {
            yield this.confirm(snippet);
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'snippet.delete.failed'});
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteSnippet;
}
