import ModalComponent from 'ghost-admin/components/modal-base';
import classic from 'ember-classic-decorator';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {action} from '@ember/object';
import {alias} from '@ember/object/computed';
import {classNames} from '@ember-decorators/component';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

@classic
@classNames('modal-impersonate-member')
export default class ModalImpersonateMember extends ModalComponent {
    @service
    config;

    @service
    store;

    signinUrl = null;

    @alias('model')
    member;

    didInsertElement() {
        super.didInsertElement(...arguments);

        this._signinUrlUpdateTask.perform();
    }

    // noop - we don't want the enter key doing anything
    @action
    confirm() {}

    @task(function* () {
        copyTextToClipboard(this.signinUrl);
        yield timeout(1000);
        return true;
    })
    copySigninUrl;

    @(task(function*() {
        const memberSigninURL = yield this.member.fetchSigninUrl.perform();

        this.set('signinUrl', memberSigninURL.url);
    }).drop())
    _signinUrlUpdateTask;
}
