import ModalComponent from 'ghost-admin/components/modal-base';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

const URL_FETCH_TIMEOUT = 60000; // 1 minute timeout as token lives for 10 minutes

export default ModalComponent.extend({
    store: service(),

    classNames: 'modal-impersonate-member',

    signin_url: null,
    member: alias('model'),

    init() {
        this._super(...arguments);
    },

    didInsertElement() {
        this._super(...arguments);

        this._signinUrlUpdateTask.perform();
    },

    actions: {
    },

    copyMagicLink: task(function* () {
        copyTextToClipboard(this.member.get('signin_url'));
        yield timeout(2000);
        return true;
    }),

    _updateSigninUrl: task(function*() {
        let member = yield this.store.findRecord('member', this.member.get('id'), {
            reload: true
        });

        this.set('signin_url', member.signin_url);
    }).drop(),

    _signinUrlUpdateTask: task(function*() {
        yield this._updateSigninUrl.perform();

        yield timeout(URL_FETCH_TIMEOUT);

        this.signinUrlTask = this._signinUrlUpdateTask.perform();
    }).restartable()
});
