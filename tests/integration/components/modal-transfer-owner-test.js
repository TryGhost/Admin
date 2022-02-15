import RSVP from 'rsvp';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: modal-transfer-owner', function (hooks) {
    setupRenderingTest(hooks);

    test('triggers confirm action', async function (assert) {
        let confirm = sinon.stub();
        let closeModal = sinon.spy();

        confirm.returns(RSVP.resolve({}));

        this.set('confirm', confirm);
        this.set('closeModal', closeModal);

        await render(hbs`{{modal-transfer-owner confirm=(action confirm) closeModal=(action closeModal)}}`);
        await click('.gh-btn.gh-btn-red');

        assert.true(confirm.calledOnce, 'confirm called');
        assert.true(closeModal.calledOnce, 'closeModal called');
    });
});
