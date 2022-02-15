import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Model: tag', function (hooks) {
    setupTest(hooks);

    test('has a validation type of "tag"', function (assert) {
        let model = this.owner.lookup('service:store').createRecord('tag');

        assert.strictEqual(model.get('validationType'), 'tag');
    });
});
