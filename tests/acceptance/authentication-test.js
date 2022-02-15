import windowProxy from 'ghost-admin/utils/window-proxy';
import {Response} from 'ember-cli-mirage';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentRouteName, currentURL, fillIn, findAll, visit} from '@ember/test-helpers';
import {module, skip, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';

module('Acceptance: Authentication', function (hooks) {
    let originalReplaceLocation;

    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('setup redirect', function (hooks) {
        hooks.beforeEach(function () {
            // ensure the /users/me route doesn't error
            this.server.create('user');
            this.server.get('authentication/setup', function () {
                return {setup: [{status: false}]};
            });
        });
        test('redirects to setup when setup isn\'t complete', async function (assert) {
            await visit('settings/labs');
            assert.strictEqual(currentURL(), '/setup/one');
        });
    });

    module('general page', function (hooks) {
        let newLocation;

        hooks.beforeEach(function () {
            originalReplaceLocation = windowProxy.replaceLocation;
            windowProxy.replaceLocation = function (url) {
                url = url.replace(/^\/ghost\//, '/');
                newLocation = url;
            };
            newLocation = undefined;

            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role], slug: 'test-user'});
        });

        hooks.afterEach(function () {
            windowProxy.replaceLocation = originalReplaceLocation;
        });

        test('invalidates session on 401 API response', async function (assert) {
            // return a 401 when attempting to retrieve users
            this.server.get('/users/', () => new Response(401, {}, {
                errors: [
                    {message: 'Access denied.', type: 'UnauthorizedError'}
                ]
            }));

            await authenticateSession();
            await visit('/settings/staff');

            // running `visit(url)` inside windowProxy.replaceLocation breaks
            // the async behaviour so we need to run `visit` here to simulate
            // the browser visiting the new page
            if (newLocation) {
                await visit(newLocation);
            }

            assert.strictEqual(currentURL(), '/signin', 'url after 401');
        });

        test('doesn\'t show navigation menu on invalid url when not authenticated', async function (assert) {
            await invalidateSession();

            await visit('/');

            assert.strictEqual(currentURL(), '/signin', 'current url');
            assert.strictEqual(findAll('nav.gh-nav').length, 0, 'nav menu presence');

            await visit('/signin/invalidurl/');

            assert.strictEqual(currentURL(), '/signin/invalidurl/', 'url after invalid url');
            assert.strictEqual(currentRouteName(), 'error404', 'path after invalid url');
            assert.strictEqual(findAll('nav.gh-nav').length, 0, 'nav menu presence');
        });

        test('shows nav menu on invalid url when authenticated', async function (assert) {
            await authenticateSession();
            await visit('/signin/invalidurl/');

            assert.strictEqual(currentURL(), '/signin/invalidurl/', 'url after invalid url');
            assert.strictEqual(currentRouteName(), 'error404', 'path after invalid url');
            assert.strictEqual(findAll('nav.gh-nav').length, 1, 'nav menu presence');
        });
    });

    // TODO: re-enable once modal reappears correctly
    module('editor', function (hooks) {
        let origDebounce = run.debounce;
        let origThrottle = run.throttle;

        // we don't want the autosave interfering in this test
        hooks.beforeEach(function () {
            run.debounce = function () { };
            run.throttle = function () { };
        });

        skip('displays re-auth modal attempting to save with invalid session', async function (assert) {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            // simulate an invalid session when saving the edited post
            this.server.put('/posts/:id/', function ({posts}, {params}) {
                let post = posts.find(params.id);
                let attrs = this.normalizedRequestAttrs();

                if (attrs.mobiledoc.cards[0][1].markdown === 'Edited post body') {
                    return new Response(401, {}, {
                        errors: [
                            {message: 'Access denied.', type: 'UnauthorizedError'}
                        ]
                    });
                } else {
                    return post.update(attrs);
                }
            });

            await authenticateSession();

            await visit('/editor');

            // create the post
            await fillIn('#entry-title', 'Test Post');
            await fillIn('.__mobiledoc-editor', 'Test post body');
            await click('.js-publish-button');

            // we shouldn't have a modal at this point
            assert.strictEqual(findAll('.modal-container #login').length, 0, 'modal exists');
            // we also shouldn't have any alerts
            assert.strictEqual(findAll('.gh-alert').length, 0, 'no of alerts');

            // update the post
            await fillIn('.__mobiledoc-editor', 'Edited post body');
            await click('.js-publish-button');

            // we should see a re-auth modal
            assert.strictEqual(findAll('.fullscreen-modal #login').length, 1, 'modal exists');
        });

        // don't clobber debounce/throttle for future tests
        hooks.afterEach(function () {
            run.debounce = origDebounce;
            run.throttle = origThrottle;
        });
    });
});
