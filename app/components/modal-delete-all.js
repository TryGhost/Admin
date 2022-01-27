import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalDeleteAll extends ModalComponent {
    @service
    ghostPaths;

    @service
    notifications;

    @service
    store;

    @service
    ajax;

    @action
    confirm() {
        this.deleteAll.perform();
    }

    _deleteAll() {
        let deleteUrl = this.get('ghostPaths.url').api('db');
        return this.ajax.del(deleteUrl);
    }

    _unloadData() {
        this.store.unloadAll('post');
        this.store.unloadAll('tag');
    }

    _showSuccess() {
        this.notifications.showAlert('All content deleted from database.', {type: 'success', key: 'all-content.delete.success'});
    }

    _showFailure(error) {
        this.notifications.showAPIError(error, {key: 'all-content.delete'});
    }

    @(task(function* () {
        try {
            yield this._deleteAll();
            this._unloadData();
            this._showSuccess();
        } catch (error) {
            this._showFailure(error);
        } finally {
            this.send('closeModal');
        }
    }).drop())
    deleteAll;
}
