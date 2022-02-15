import NavigationItem from 'ghost-admin/models/navigation-item';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Transform: navigation-settings', function (hooks) {
    setupTest(hooks);

    test('deserializes navigation json', function (assert) {
        let transform = this.owner.lookup('transform:navigation-settings');
        let serialized = '[{"label":"One","url":"/one"},{"label":"Two","url":"/two"}]';
        let result = transform.deserialize(serialized);

        assert.strictEqual(result.length, 2);
        assert.instanceOf(result[0]);
        assert.strictEqual(result[0].get('label'), 'One');
        assert.strictEqual(result[0].get('url'), '/one');
        assert.instanceOf(result[1]);
        assert.strictEqual(result[1].get('label'), 'Two');
        assert.strictEqual(result[1].get('url'), '/two');
    });

    test('serializes array of NavigationItems', function (assert) {
        let transform = this.owner.lookup('transform:navigation-settings');
        let deserialized = emberA([
            NavigationItem.create({label: 'One', url: '/one'}),
            NavigationItem.create({label: 'Two', url: '/two'})
        ]);
        let result = transform.serialize(deserialized);

        assert.strictEqual(result, '[{"label":"One","url":"/one"},{"label":"Two","url":"/two"}]');
    });
});
