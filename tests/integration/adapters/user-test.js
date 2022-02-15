import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Integration: Adapter: user', function (hooks) {
    setupTest(hooks);

    let server, store;

    hooks.beforeEach(function () {
        store = this.owner.lookup('service:store');
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('loads users from regular endpoint when all are fetched', function (assert) {
        server.get(`${ghostPaths().apiRoot}/users/`, function () {
            return [200, {'Content-Type': 'application/json'}, JSON.stringify({users: [
                {
                    id: 1,
                    name: 'User 1',
                    slug: 'user-1'
                }, {
                    id: 2,
                    name: 'User 2',
                    slug: 'user-2'
                }
            ]})];
        });

        store.findAll('user', {reload: true}).then((users) => {
            assert.ok(users);
            assert.strictEqual(users.objectAtContent(0).get('name'), 'User 1');
        });
    });

    test('loads user from slug endpoint when single user is queried and slug is passed in', function (assert) {
        server.get(`${ghostPaths().apiRoot}/users/slug/user-1/`, function () {
            return [200, {'Content-Type': 'application/json'}, JSON.stringify({users: [
                {
                    id: 1,
                    slug: 'user-1',
                    name: 'User 1'
                }
            ]})];
        });

        store.queryRecord('user', {slug: 'user-1'}).then((user) => {
            assert.ok(user);
            assert.strictEqual(user.get('name'), 'User 1');
        });
    });

    test('handles "include" parameter when querying single user via slug', function (assert) {
        server.get(`${ghostPaths().apiRoot}/users/slug/user-1/`, (request) => {
            let params = request.queryParams;
            assert.strictEqual(params.include, 'roles,count.posts', 'include query');

            return [200, {'Content-Type': 'application/json'}, JSON.stringify({users: [
                {
                    id: 1,
                    slug: 'user-1',
                    name: 'User 1',
                    count: {
                        posts: 5
                    }
                }
            ]})];
        });

        store.queryRecord('user', {slug: 'user-1', include: 'count.posts'}).then((user) => {
            assert.ok(user);
            assert.strictEqual(user.get('name'), 'User 1');
            assert.strictEqual(user.get('count.posts'), 5);
        });
    });
});
