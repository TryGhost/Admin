import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {settled} from '@ember/test-helpers';
import {setupTest} from 'ember-qunit';

module('Unit: Model: invite', function (hooks) {
    setupTest(hooks);

    module('with network', function (hooks) {
        let server;

        hooks.beforeEach(function () {
            server = new Pretender();
        });

        hooks.afterEach(function () {
            server.shutdown();
        });

        test('resend hits correct endpoints', async function (assert) {
            let store = this.owner.lookup('service:store');
            let model = store.createRecord('invite', {
                id: 42
            });
            let role;

            server.delete(`${ghostPaths().apiRoot}/invites/42`, function () {
                return [204, {}, '{}'];
            });

            server.post(`${ghostPaths().apiRoot}/invites/`, function () {
                return [200, {}, '{}'];
            });

            run(() => {
                role = store.push({data: {id: 1, type: 'role', attributes: {name: 'Editor'}}});
                model.set('email', 'resend-test@example.com');
                model.set('role', role);
                model.resend();
            });
            await settled();

            assert.strictEqual(server.handledRequests.length, 2, 'number of requests');
            let [, lastRequest] = server.handledRequests;
            let requestBody = JSON.parse(lastRequest.requestBody);
            let [invite] = requestBody.invites;

            assert.strictEqual(requestBody.invites.length, 1, 'number of invites in request body');

            assert.strictEqual(invite.email, 'resend-test@example.com');
            // eslint-disable-next-line camelcase
            assert.strictEqual(invite.role_id, '1', 'role ID');
        });
    });
});
