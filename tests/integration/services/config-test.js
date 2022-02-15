import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {module, test} from 'qunit';
import {settled} from '@ember/test-helpers';
import {setupTest} from 'ember-qunit';

module('Integration: Service: config', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('returns a list of timezones in the expected format', function (assert) {
        let service = this.owner.lookup('service:config');

        service.get('availableTimezones').then(function (timezones) {
            assert.strictEqual(timezones.length, 66);
            assert.strictEqual(timezones[0].name, 'Pacific/Pago_Pago');
            assert.strictEqual(timezones[0].label, '(GMT -11:00) Midway Island, Samoa');
            assert.strictEqual(timezones[1].name, 'Pacific/Honolulu');
            assert.strictEqual(timezones[1].label, '(GMT -10:00) Hawaii');
        });
    });

    test('normalizes blogUrl to non-trailing-slash', function (assert) {
        let stubBlogUrl = function stubBlogUrl(url) {
            server.get(`${ghostPaths().apiRoot}/config/`, function () {
                return [
                    200,
                    {'Content-Type': 'application/json'},
                    JSON.stringify({})
                ];
            });

            server.get(`${ghostPaths().apiRoot}/site/`, function () {
                return [
                    200,
                    {'Content-Type': 'application/json'},
                    JSON.stringify({
                        site: {
                            url
                        }
                    })
                ];
            });
        };
        let service = this.owner.lookup('service:config');

        stubBlogUrl('http://localhost:2368/');

        service.fetch().then(() => {
            assert.strictEqual(service.get('blogUrl'), 'http://localhost:2368', 'trailing-slash');
        });

        settled().then(() => {
            stubBlogUrl('http://localhost:2368');

            service.fetch().then(() => {
                assert.strictEqual(service.get('blogUrl'), 'http://localhost:2368', 'non-trailing-slash');
            });
        });
    });
});
