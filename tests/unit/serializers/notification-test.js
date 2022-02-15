import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Serializer: notification', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('converts location->key when deserializing', function (assert) {
        server.get(`${ghostPaths().apiRoot}/notifications`, function () {
            let response = {
                notifications: [{
                    id: 1,
                    dismissible: false,
                    status: 'alert',
                    type: 'info',
                    location: 'test.foo',
                    message: 'This is a test'
                }]
            };

            return [200, {'Content-Type': 'application/json'}, JSON.stringify(response)];
        });

        let store = this.owner.lookup('service:store');

        return store.findAll('notification').then((notifications) => {
            assert.strictEqual(notifications.get('length'), 1);
            assert.strictEqual(notifications.get('firstObject.key'), 'test.foo');
        });
    });
});
