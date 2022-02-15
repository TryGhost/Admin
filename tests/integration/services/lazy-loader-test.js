import Pretender from 'pretender';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Integration: Service: lazy-loader', function (hooks) {
    setupTest(hooks);

    let server;
    let ghostPaths = {
        adminRoot: '/assets/'
    };

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('loads a script correctly and only once', async function (assert) {
        let subject = this.owner.lookup('service:lazy-loader');

        subject.setProperties({
            ghostPaths,
            scriptPromises: {},
            testing: false
        });

        // first load should add script element
        await subject.loadScript('test', 'lazy-test.js')
            .then(() => {})
            .catch(() => {});

        assert.strictEqual(document.querySelectorAll('script[src="/assets/lazy-test.js"]').length, 1, 'no of script tags on first load');

        // second load should not add another script element
        await subject.loadScript('test', '/assets/lazy-test.js')
            .then(() => { })
            .catch(() => { });

        assert.strictEqual(document.querySelectorAll('script[src="/assets/lazy-test.js"]').length, 1, 'no of script tags on second load');
    });

    test('loads styles correctly', function (assert) {
        let subject = this.owner.lookup('service:lazy-loader');

        subject.setProperties({
            ghostPaths,
            testing: false
        });

        return subject.loadStyle('testing', 'style.css').catch(() => {
            // we add a catch handler here because `/assets/style.css` doesn't exist
            assert.strictEqual(document.querySelectorAll('#testing-styles').length, 1);
            assert.strictEqual(document.querySelector('#testing-styles').getAttribute('href'), '/assets/style.css');
        });
    });
});
