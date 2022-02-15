import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Model: navigation-item', function (hooks) {
    setupTest(hooks);

    test('isComplete is true when label and url are filled', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', 'test');
        model.set('url', 'test');

        assert.true(model.get('isComplete'));
    });

    test('isComplete is false when label is blank', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', '');
        model.set('url', 'test');

        assert.false(model.get('isComplete'));
    });

    test('isComplete is false when url is blank', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', 'test');
        model.set('url', '');

        assert.false(model.get('isComplete'));
    });

    test('isBlank is true when label and url are blank', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', '');
        model.set('url', '');

        assert.true(model.get('isBlank'));
    });

    test('isBlank is false when label is present', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', 'test');
        model.set('url', '');

        assert.false(model.get('isBlank'));
    });

    test('isBlank is false when url is present', function (assert) {
        let model = this.owner.lookup('model:navigation-item');

        model.set('label', '');
        model.set('url', 'test');

        assert.false(model.get('isBlank'));
    });
});
