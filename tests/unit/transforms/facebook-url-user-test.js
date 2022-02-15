import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Transform: facebook-url-user', function (hooks) {
    setupTest(hooks);

    test('deserializes facebook url', function (assert) {
        let transform = this.owner.lookup('transform:facebook-url-user');
        let serialized = 'testuser';
        let result = transform.deserialize(serialized);

        assert.strictEqual(result, 'https://www.facebook.com/testuser');
    });

    test('serializes url to facebook username', function (assert) {
        let transform = this.owner.lookup('transform:facebook-url-user');
        let deserialized = 'https://www.facebook.com/testuser';
        let result = transform.serialize(deserialized);

        assert.strictEqual(result, 'testuser');
    });
});
