import ModalComponent from 'ghost-admin/components/modal-base';
import copyTextToClipboard from 'ghost-admin/utils/copy-text-to-clipboard';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

const URL_FETCH_TIMEOUT = 60000; // 1 minute timeout as token lives for 10 minutes

export default ModalComponent.extend({
    config: service(),
    store: service(),

    classNames: 'modal-impersonate-member',

    signinUrl: null,
    member: alias('model'),

    init() {
        this._super(...arguments);
    },

    didInsertElement() {
        this._super(...arguments);

        this._signinUrlUpdateTask.perform();
    },

    actions: {},

    copySigninUrl: task(function* () {
        copyTextToClipboard(this.get('signinUrl'));
        yield timeout(1000);
    }),

    _updateSigninUrl: task(function*() {
        let member = yield this.store.queryRecord(
            'member',
            {
                id: this.member.get('id'),
                include: 'signin_url'
            }
        );

        this.set('signinUrl', member.signinUrl);
    }).drop(),

    _signinUrlUpdateTask: task(function*() {
        yield this._updateSigninUrl.perform();

        yield timeout(URL_FETCH_TIMEOUT);

        this.signinUrlTask = this._signinUrlUpdateTask.perform();
    }).restartable()
});
