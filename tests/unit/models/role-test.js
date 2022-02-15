import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-qunit';

module('Unit: Model: role', function (hooks) {
    setupTest(hooks);

    test('provides a lowercase version of the name', function (assert) {
        let model = this.owner.lookup('service:store').createRecord('role', {
            name: 'Author'
        });

        assert.strictEqual(model.get('name'), 'Author');
        assert.strictEqual(model.get('lowerCaseName'), 'author');

        run(function () {
            model.set('name', 'Editor');

            assert.strictEqual(model.get('name'), 'Editor');
            assert.strictEqual(model.get('lowerCaseName'), 'editor');
        });
    });
});
