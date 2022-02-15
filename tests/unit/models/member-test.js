import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Model: member', function (hooks) {
    setupTest(hooks);

    let store;

    hooks.beforeEach(function () {
        store = this.owner.lookup('service:store');
    });

    test('has a validation type of "member"', function (assert) {
        let model = store.createRecord('member');

        assert.strictEqual(model.get('validationType'), 'member');
    });
});
