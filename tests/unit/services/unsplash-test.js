import Pretender from 'pretender';
import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {settled} from '@ember/test-helpers';
import {setupTest} from 'ember-qunit';

module('Unit: Service: unsplash', function (hooks) {
    setupTest(hooks);

    let server;

    beforeEach(function () {
        server = new Pretender();
    });

    afterEach(function () {
        server.shutdown();
    });

    test('can load new');
    test('can load next page');

    module('search', function () {
        test('sends search request');
        test('debounces query updates');
        test('can load next page of search results');
        test('clears photos when starting new search');
        test('loads new when query is cleared');
    });

    module('columns', function () {
        test('sorts photos into columns based on column height');
        test('can change column count');
    });

    module('error handling', function () {
        test('handles rate limit exceeded', async function (assert) {
            server.get('https://api.unsplash.com/photos', function () {
                return [403, {'x-ratelimit-remaining': '0'}, 'Rate Limit Exceeded'];
            });

            let service = this.owner.lookup('service:unsplash');

            run(() => {
                service.loadNextPage();
            });
            await settled();

            assert.includes(service.get('error'), 'Unsplash API rate limit reached');
        });

        test('handles json errors', async function (assert) {
            server.get('https://api.unsplash.com/photos', function () {
                return [500, {'Content-Type': 'application/json'}, JSON.stringify({
                    errors: ['Unsplash API Error']
                })];
            });

            let service = this.owner.lookup('service:unsplash');

            run(() => {
                service.loadNextPage();
            });
            await settled();

            assert.strictEqual(service.get('error'), 'Unsplash API Error');
        });

        test('handles text errors', async function (assert) {
            server.get('https://api.unsplash.com/photos', function () {
                return [500, {'Content-Type': 'text/xml'}, 'Unsplash text error'];
            });

            let service = this.owner.lookup('service:unsplash');

            run(() => {
                service.loadNextPage();
            });
            await settled();

            assert.strictEqual(service.get('error'), 'Unsplash text error');
        });
    });

    module('isLoading', function () {
        test('is false by default');
        test('is true when loading new');
        test('is true when loading next page');
        test('is true when searching');
        test('returns to false when finished');
    });
});
