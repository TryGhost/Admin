import hbs from 'htmlbars-inline-precompile';
import {blur, click, fillIn, render, triggerKeyEvent} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

// we want baseUrl to match the running domain so relative URLs are
// handled as expected (browser auto-sets the domain when using a.href)
let currentUrl = `${window.location.protocol}//${window.location.host}/`;

module('Integration: Component: gh-navitem-url-input', function (hooks) {
    setupRenderingTest(hooks);

    beforeEach(function () {
        // set defaults
        this.set('baseUrl', currentUrl);
        this.set('url', '');
        this.set('isNew', false);
        this.set('clearErrors', function () {
            return null;
        });
    });

    test('renders correctly with blank url', async function (assert) {
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew clearErrors=(action clearErrors)}}
        `);

        assert.dom('input').exists({count: 1});
        assert.dom('input').hasClass('gh-input');
        assert.dom('input').hasValue(currentUrl);
    });

    test('renders correctly with relative urls', async function (assert) {
        this.set('url', '/about');
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew clearErrors=(action clearErrors)}}
        `);

        assert.dom('input').hasValue(`${currentUrl}about`);

        this.set('url', '/about#contact');
        assert.dom('input').hasValue(`${currentUrl}about#contact`);
    });

    test('renders correctly with absolute urls', async function (assert) {
        this.set('url', 'https://example.com:2368/#test');
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew clearErrors=(action clearErrors)}}
        `);

        assert.dom('input').hasValue('https://example.com:2368/#test');

        this.set('url', 'mailto:test@example.com');
        assert.dom('input').hasValue('mailto:test@example.com');

        this.set('url', 'tel:01234-5678-90');
        assert.dom('input').hasValue('tel:01234-5678-90');

        this.set('url', '//protocol-less-url.com');
        assert.dom('input').hasValue('//protocol-less-url.com');

        this.set('url', '#anchor');
        assert.dom('input').hasValue('#anchor');
    });

    test('deletes base URL on backspace', async function (assert) {
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew clearErrors=(action clearErrors)}}
        `);

        assert.dom('input').hasValue(currentUrl);
        await triggerKeyEvent('input', 'keydown', 8);
        assert.dom('input').hasValue('');
    });

    test('deletes base URL on delete', async function (assert) {
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew clearErrors=(action clearErrors)}}
        `);

        assert.dom('input').hasValue(currentUrl);
        await triggerKeyEvent('input', 'keydown', 46);
        assert.dom('input').hasValue('');
    });

    test('adds base url to relative urls on blur', async function (assert) {
        this.set('updateUrl', val => val);
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        await fillIn('input', '/about');
        await blur('input');

        assert.dom('input').hasValue(`${currentUrl}about/`);
    });

    test('adds "mailto:" to email addresses on blur', async function (assert) {
        this.set('updateUrl', val => val);
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        await fillIn('input', 'test@example.com');
        await blur('input');

        assert.dom('input').hasValue('mailto:test@example.com');

        // ensure we don't double-up on the mailto:
        await blur('input');
        assert.dom('input').hasValue('mailto:test@example.com');
    });

    test('doesn\'t add base url to invalid urls on blur', async function (assert) {
        this.set('updateUrl', val => val);
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let changeValue = async (value) => {
            await fillIn('input', value);
            await blur('input');
        };

        await changeValue('with spaces');
        assert.dom('input').hasValue('with spaces');

        await changeValue('/with spaces');
        assert.dom('input').hasValue('/with spaces');
    });

    test('doesn\'t mangle invalid urls on blur', async function (assert) {
        this.set('updateUrl', val => val);
        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        await fillIn('input', `${currentUrl} /test`);
        await blur('input');

        assert.dom('input').hasValue(`${currentUrl} /test`);
    });

    // https://github.com/TryGhost/Ghost/issues/9373
    test('doesn\'t mangle urls when baseUrl has unicode characters', async function (assert) {
        this.set('updateUrl', val => val);

        this.set('baseUrl', 'http://exämple.com');

        await render(hbs`
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);
        await fillIn('input', `${currentUrl}/test`);
        await blur('input');

        assert.dom('input').hasValue(`${currentUrl}/test`);
    });

    test('triggers "update" action on blur', async function (assert) {
        let changeActionCallCount = 0;
        this.set('updateUrl', (val) => {
            changeActionCallCount += 1;
            return val;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);
        await click('input');
        await blur('input');

        assert.strictEqual(changeActionCallCount, 1);
    });

    test('triggers "update" action on enter', async function (assert) {
        let changeActionCallCount = 0;
        this.set('updateUrl', (val) => {
            changeActionCallCount += 1;
            return val;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);
        await triggerKeyEvent('input', 'keypress', 13);

        assert.strictEqual(changeActionCallCount, 1);
    });

    test('triggers "update" action on CMD-S', async function (assert) {
        let changeActionCallCount = 0;
        this.set('updateUrl', (val) => {
            changeActionCallCount += 1;
            return val;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);
        await triggerKeyEvent('input', 'keydown', 83, {
            metaKey: true
        });

        assert.strictEqual(changeActionCallCount, 1);
    });

    test('sends absolute urls straight through to update action', async function (assert) {
        let lastSeenUrl = '';

        this.set('updateUrl', (url) => {
            lastSeenUrl = url;
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let testUrl = async (url) => {
            await fillIn('input', url);
            await blur('input');
            assert.strictEqual(lastSeenUrl, url);
        };

        await testUrl('http://example.com');
        await testUrl('http://example.com/');
        await testUrl('https://example.com');
        await testUrl('//example.com');
        await testUrl('//localhost:1234');
        await testUrl('#anchor');
        await testUrl('mailto:test@example.com');
        await testUrl('tel:12345-567890');
        await testUrl('javascript:alert("testing");');
    });

    test('strips base url from relative urls before sending to update action', async function (assert) {
        let lastSeenUrl = '';

        this.set('updateUrl', (url) => {
            lastSeenUrl = url;
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let testUrl = async (url) => {
            await fillIn('input', `${currentUrl}${url}`);
            await blur('input');
            assert.strictEqual(lastSeenUrl, `/${url}`);
        };

        await testUrl('about/');
        await testUrl('about#contact');
        await testUrl('test/nested/');
    });

    test('handles links to subdomains of blog domain', async function (assert) {
        let expectedUrl = '';

        this.set('baseUrl', 'http://example.com/');

        this.set('updateUrl', (url) => {
            assert.strictEqual(url, expectedUrl);
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        expectedUrl = 'http://test.example.com/';
        await fillIn('input', expectedUrl);
        await blur('input');
        assert.dom('input').hasValue(expectedUrl);
    });

    test('adds trailing slash to relative URL', async function (assert) {
        let lastSeenUrl = '';

        this.set('updateUrl', (url) => {
            lastSeenUrl = url;
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let testUrl = async (url) => {
            await fillIn('input', `${currentUrl}${url}`);
            await blur('input');
            assert.strictEqual(lastSeenUrl, `/${url}/`);
        };

        await testUrl('about');
        await testUrl('test/nested');
    });

    test('does not add trailing slash on relative URL with [.?#]', async function (assert) {
        let lastSeenUrl = '';

        this.set('updateUrl', (url) => {
            lastSeenUrl = url;
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let testUrl = async (url) => {
            await fillIn('input', `${currentUrl}${url}`);
            await blur('input');
            assert.strictEqual(lastSeenUrl, `/${url}`);
        };

        await testUrl('about#contact');
        await testUrl('test/nested.svg');
        await testUrl('test?gho=sties');
        await testUrl('test/nested?sli=mer');
    });

    test('does not add trailing slash on non-relative URLs', async function (assert) {
        let lastSeenUrl = '';

        this.set('updateUrl', (url) => {
            lastSeenUrl = url;
            return url;
        });

        await render(hbs `
            {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
        `);

        let testUrl = async (url) => {
            await fillIn('input', url);
            await blur('input');
            assert.strictEqual(lastSeenUrl, url);
        };

        await testUrl('http://woo.ff/test');
        await testUrl('http://me.ow:2342/nested/test');
        await testUrl('https://wro.om/car#race');
        await testUrl('https://kabo.om/explosion?really=now');
    });

    module('with sub-folder baseUrl', function (hooks) {
        hooks.beforeEach(function () {
            this.set('baseUrl', `${currentUrl}blog/`);
        });

        test('handles URLs relative to base url', async function (assert) {
            let lastSeenUrl = '';

            this.set('updateUrl', (url) => {
                lastSeenUrl = url;
                return url;
            });

            await render(hbs `
                {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
            `);

            let testUrl = async (url) => {
                await fillIn('input', `${currentUrl}blog${url}`);
                await blur('input');
                assert.strictEqual(lastSeenUrl, url);
            };

            await testUrl('/about/');
            await testUrl('/about#contact');
            await testUrl('/test/nested/');
        });

        test('handles URLs relative to base host', async function (assert) {
            let lastSeenUrl = '';

            this.set('updateUrl', (url) => {
                lastSeenUrl = url;
                return url;
            });

            await render(hbs `
                {{gh-navitem-url-input baseUrl=baseUrl url=url isNew=isNew update=(action updateUrl) clearErrors=(action clearErrors)}}
            `);

            let testUrl = async (url) => {
                await fillIn('input', url);
                await blur('input');
                assert.strictEqual(lastSeenUrl, url);
            };

            await testUrl(`http://${window.location.host}`);
            await testUrl(`https://${window.location.host}`);
            await testUrl(`http://${window.location.host}/`);
            await testUrl(`https://${window.location.host}/`);
            await testUrl(`http://${window.location.host}/test`);
            await testUrl(`https://${window.location.host}/test`);
            await testUrl(`http://${window.location.host}/#test`);
            await testUrl(`https://${window.location.host}/#test`);
            await testUrl(`http://${window.location.host}/another/folder`);
            await testUrl(`https://${window.location.host}/another/folder`);
        });
    });
});
