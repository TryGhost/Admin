import Pretender from 'pretender';
import config from 'ghost-admin/config/environment';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Integration: Service: store', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('adds Ghost version header to requests', function (assert) {
        let {version} = config.APP;
        let store = this.owner.lookup('service:store');

        server.get(`${ghostPaths().apiRoot}/posts/1/`, function () {
            return [
                404,
                {'Content-Type': 'application/json'},
                JSON.stringify({})
            ];
        });

        store.find('post', 1).catch(() => {
            let [request] = server.handledRequests;
            assert.strictEqual(request.requestHeaders['X-Ghost-Version'], version);
        });
    });
});
