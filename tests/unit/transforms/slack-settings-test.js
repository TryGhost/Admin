import SlackIntegration from 'ghost-admin/models/slack-integration';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Transform: slack-settings', function (hooks) {
    setupTest(hooks);

    test('deserializes settings json', function (assert) {
        let transform = this.owner.lookup('transform:slack-settings');
        let serialized = '[{"url":"http://myblog.com/blogpost1","username":"SlackBot"}]';
        let result = transform.deserialize(serialized);

        assert.strictEqual(result.length, 1);
        assert.instanceOf(result[0]);
        assert.strictEqual(result[0].get('url'), 'http://myblog.com/blogpost1');
        assert.strictEqual(result[0].get('username'), 'SlackBot');
    });

    test('deserializes empty array', function (assert) {
        let transform = this.owner.lookup('transform:slack-settings');
        let serialized = '[]';
        let result = transform.deserialize(serialized);

        assert.strictEqual(result.length, 1);
        assert.instanceOf(result[0]);
        assert.strictEqual(result[0].get('url'), '');
        assert.strictEqual(result[0].get('username'), '');
    });

    test('serializes array of Slack settings', function (assert) {
        let transform = this.owner.lookup('transform:slack-settings');
        let deserialized = emberA([
            SlackIntegration.create({url: 'http://myblog.com/blogpost1', username: 'SlackBot'})
        ]);
        let result = transform.serialize(deserialized);

        assert.strictEqual(result, '[{"url":"http://myblog.com/blogpost1","username":"SlackBot"}]');
    });

    test('serializes empty SlackIntegration objects', function (assert) {
        let transform = this.owner.lookup('transform:slack-settings');
        let deserialized = emberA([
            SlackIntegration.create({url: ''})
        ]);
        let result = transform.serialize(deserialized);

        assert.strictEqual(result, '[]');
    });
});
