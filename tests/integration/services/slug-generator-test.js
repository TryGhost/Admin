import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {dasherize} from '@ember/string';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

function stubSlugEndpoint(server, type, slug) {
    server.get(`${ghostPaths().apiRoot}/slugs/:type/:slug/`, function (request) {
        expect(request.params.type).to.equal(type);
        expect(request.params.slug).to.equal(slug);

        return [
            200,
            {'Content-Type': 'application/json'},
            JSON.stringify({slugs: [{slug: dasherize(slug)}]})
        ];
    });
}

module('Integration: Service: slug-generator', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('returns empty if no slug is provided', function (assert) {
        let service = this.owner.lookup('service:slug-generator');

        service.generateSlug('post', '').then(function (slug) {
            assert.strictEqual(slug, '');
        });
    });

    test('calls correct endpoint and returns correct data', function (assert) {
        let rawSlug = 'a test post';
        stubSlugEndpoint(server, 'post', rawSlug);

        let service = this.owner.lookup('service:slug-generator');

        service.generateSlug('post', rawSlug).then(function (slug) {
            assert.strictEqual(slug, dasherize(rawSlug));
        });
    });
});
