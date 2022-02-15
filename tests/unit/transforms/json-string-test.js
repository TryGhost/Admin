import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Transform: json-string', function (hooks) {
    setupTest(hooks);

    test('serialises an Object to a JSON String', function (assert) {
        let transform = this.owner.lookup('transform:json-string');
        let obj = {one: 'one', two: 'two'};
        assert.strictEqual(transform.serialize(obj), JSON.stringify(obj));
    });

    test('deserialises a JSON String to an Object', function (assert) {
        let transform = this.owner.lookup('transform:json-string');
        let obj = {one: 'one', two: 'two'};
        assert.deepEqual(transform.deserialize(JSON.stringify(obj)), obj);
    });

    test('handles deserializing a blank string', function (assert) {
        let transform = this.owner.lookup('transform:json-string');
        assert.strictEqual(transform.deserialize(''), null);
    });
});
