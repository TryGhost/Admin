import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Model: setting', function (hooks) {
    setupTest(hooks);

    test('has a validation type of "setting"', function (assert) {
        let model = this.owner.lookup('service:store').createRecord('setting');

        assert.strictEqual(model.get('validationType'), 'setting');
    });
});
