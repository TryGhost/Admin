import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit | Service | limit', function (hooks) {
    setupTest(hooks);

    let limitService;

    hooks.beforeEach(function () {
        limitService = this.owner.lookup('service:limit');
    });

    test('exists', function (assert) {
        assert.ok(limitService);
    });
});
