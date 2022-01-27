import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import {action, set} from '@ember/object';
import {fetch} from 'fetch';
import {not} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

@classic
export default class ModalResetAllPasswords extends ModalComponent {
    @service
    notifications;

    isChecked = false;

    @not('isChecked')
    isConfirmDisabled;

    @action
    toggleCheckbox() {
        set(this, 'isChecked', !this.isChecked);
    }

    @action
    confirm() {
        this.deletePost.perform();
    }

    async _resetPasswords() {
        const res = await fetch('/ghost/api/canary/admin/authentication/reset_all_passwords/', {
            method: 'POST'
        });
        if (res.status < 200 || res.status >= 300) {
            throw new Error('api failed ' + res.status + ' ' + res.statusText);
        }
    }

    _failure(error) {
        this.notifications.showAPIError(error, {key: 'user.resetAllPasswords.failed'});
    }

    @(task(function* () {
        try {
            yield this._resetPasswords();
            window.location = window.location.href.split('#')[0];
        } catch (e) {
            this._failure(e);
        } finally {
            this.send('closeModal');
        }
    }).drop())
    resetPasswords;
}
