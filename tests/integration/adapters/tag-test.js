import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Integration: Adapter: tag', function (hooks) {
    setupTest(hooks);

    let server, store;

    hooks.beforeEach(function () {
        store = this.owner.lookup('service:store');
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('loads tags from regular endpoint when all are fetched', function (assert) {
        server.get(`${ghostPaths().apiRoot}/tags/`, function () {
            return [200, {'Content-Type': 'application/json'}, JSON.stringify({tags: [
                {
                    id: 1,
                    name: 'Tag 1',
                    slug: 'tag-1'
                }, {
                    id: 2,
                    name: 'Tag 2',
                    slug: 'tag-2'
                }
            ]})];
        });

        store.findAll('tag', {reload: true}).then((tags) => {
            assert.ok(tags);
            assert.strictEqual(tags.objectAtContent(0).get('name'), 'Tag 1');
        });
    });

    test('loads tag from slug endpoint when single tag is queried and slug is passed in', function (assert) {
        server.get(`${ghostPaths().apiRoot}/tags/slug/tag-1/`, function () {
            return [200, {'Content-Type': 'application/json'}, JSON.stringify({tags: [
                {
                    id: 1,
                    slug: 'tag-1',
                    name: 'Tag 1'
                }
            ]})];
        });

        store.queryRecord('tag', {slug: 'tag-1'}).then((tag) => {
            assert.ok(tag);
            assert.strictEqual(tag.get('name'), 'Tag 1');
        });
    });
});
