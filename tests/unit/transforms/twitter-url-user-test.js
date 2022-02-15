import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Transform: twitter-url-user', function (hooks) {
    setupTest(hooks);

    test('deserializes twitter url', function (assert) {
        let transform = this.owner.lookup('transform:twitter-url-user');
        let serialized = '@testuser';
        let result = transform.deserialize(serialized);

        assert.strictEqual(result, 'https://twitter.com/testuser');
    });

    test('serializes url to twitter username', function (assert) {
        let transform = this.owner.lookup('transform:twitter-url-user');
        let deserialized = 'https://twitter.com/testuser';
        let result = transform.serialize(deserialized);

        assert.strictEqual(result, '@testuser');
    });
});
