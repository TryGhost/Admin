import Pretender from 'pretender';
import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import md5 from 'blueimp-md5';
import {module, skip, test} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';
import {timeout} from 'ember-concurrency';

let pathsStub = Service.extend({
    assetRoot: '/ghost/assets/',

    init() {
        this._super(...arguments);

        this.url = {
            api() {
                return '';
            },
            asset(src) {
                return src;
            }
        };
    }
});

const stubKnownGravatar = function (server) {
    server.get('http://www.gravatar.com/avatar/:md5', function () {
        return [200, {'Content-Type': 'image/png'}, ''];
    });

    server.head('http://www.gravatar.com/avatar/:md5', function () {
        return [200, {'Content-Type': 'image/png'}, ''];
    });
};

const stubUnknownGravatar = function (server) {
    server.get('http://www.gravatar.com/avatar/:md5', function () {
        return [404, {}, ''];
    });

    server.head('http://www.gravatar.com/avatar/:md5', function () {
        return [404, {}, ''];
    });
};

let configStubuseGravatar = Service.extend({
    useGravatar: true
});

module('Integration: Component: gh-profile-image', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    hooks.beforeEach(function () {
        this.owner.register('service:ghost-paths', pathsStub);
        this.owner.register('service:config', configStubuseGravatar);

        server = new Pretender();
        stubKnownGravatar(server);
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('renders', async function (assert) {
        this.set('email', '');

        await render(hbs`
            {{gh-profile-image email=email}}
        `);

        assert.dom('.account-image').exists();
        assert.dom('.placeholder-img').exists();
        assert.dom('input[type="file"]').exists();
    });

    test('renders default image if no email supplied', async function (assert) {
        this.set('email', null);

        await render(hbs`
            {{gh-profile-image email=email size=100 debounce=50}}
        `);

        assert.dom('.gravatar-img').hasAttribute('style', 'display: none', 'gravatar image style');
    });

    test('renders the gravatar if valid email supplied and privacy.useGravatar allows it', async function (assert) {
        let email = 'test@example.com';
        let expectedUrl = `//www.gravatar.com/avatar/${md5(email)}?s=100&d=404`;

        this.set('email', email);

        await render(hbs`
            {{gh-profile-image email=email size=100 debounce=50}}
        `);

        assert.dom('.gravatar-img').hasAttribute('style', `background-image: url(${expectedUrl}); display: block`, 'gravatar image style');
    });

    test('doesn\'t render the gravatar if valid email supplied but privacy.useGravatar forbids it', async function (assert) {
        let config = this.owner.lookup('service:config');
        let email = 'test@example.com';

        this.set('email', email);
        config.set('useGravatar', false);

        await render(hbs`
            {{gh-profile-image email=email size=100 debounce=50}}
        `);

        assert.dom('.gravatar-img').hasAttribute('style', 'display: none', 'gravatar image style');
    });

    test('doesn\'t add background url if gravatar image doesn\'t exist', async function (assert) {
        stubUnknownGravatar(server);

        await render(hbs`
            {{gh-profile-image email="test@example.com" size=100 debounce=50}}
        `);

        assert.dom('.gravatar-img').hasAttribute('style', 'background-image: url(); display: none', 'gravatar image style');
    });

    // skipped due to random failures on Travis - https://github.com/TryGhost/Ghost/issues/10308
    skip('throttles gravatar loading as email is changed', async function (assert) {
        let email = 'test@example.com';
        let expectedUrl = `//www.gravatar.com/avatar/${md5(email)}?s=100&d=404`;

        this.set('email', 'test');

        await render(hbs`
            {{gh-profile-image email=email size=100 debounce=300}}
        `);

        this.set('email', email);

        await timeout(50);

        assert.dom('.gravatar-img').hasAttribute('style', 'display: none', '.gravatar-img background not immediately changed on email change');

        await timeout(250);

        assert.dom('.gravatar-img').hasAttribute('style', 'display: none', '.gravatar-img background still not changed before debounce timeout');

        await timeout(100);

        assert.dom('.gravatar-img').hasAttribute('style', `background-image: url(${expectedUrl}); display: block`, '.gravatar-img background changed after debounce timeout');
    });
});
