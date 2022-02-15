import Mirage from 'ember-cli-mirage';
import {authenticateSession} from 'ember-simple-auth/test-support';
import {click, currentRouteName, fillIn, find, findAll, visit} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {versionMismatchResponse} from 'ghost-admin/mirage/utils';

let htmlErrorResponse = function () {
    return new Mirage.Response(
        504,
        {'Content-Type': 'text/html'},
        '<!DOCTYPE html><head><title>Server Error</title></head><body>504 Gateway Timeout</body></html>'
    );
};

module('Acceptance: Error Handling', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('VersionMismatch errors', function () {
        module('logged in', function (hooks) {
            hooks.beforeEach(async function () {
                let role = this.server.create('role', {name: 'Administrator'});
                this.server.create('user', {roles: [role]});

                return await authenticateSession();
            });

            test('displays an alert and disables navigation when saving', async function (assert) {
                this.server.createList('post', 3);

                // mock the post save endpoint to return version mismatch
                this.server.put('/posts/:id', versionMismatchResponse);

                await visit('/posts');
                await click('.posts-list li:nth-of-type(2) a'); // select second post
                await click('[data-test-publishmenu-trigger]');
                await click('[data-test-publishmenu-save]');

                // has the refresh to update alert
                assert.strictEqual(findAll('.gh-alert').length, 1);
                assert.match(find('.gh-alert').textContent, /refresh/);

                // try navigating back to the content list
                await click('[data-test-link="posts"]');

                assert.strictEqual(currentRouteName(), 'editor.edit');
            });

            test('displays alert and aborts the transition when navigating', async function (assert) {
                await visit('/posts');

                // mock the tags endpoint to return version mismatch
                this.server.get('/tags/', versionMismatchResponse);

                await click('[data-test-nav="tags"]');

                // navigation is blocked on loading screen
                assert.strictEqual(currentRouteName(), 'tags_loading');

                // has the refresh to update alert
                assert.strictEqual(findAll('.gh-alert').length, 1);
                assert.match(find('.gh-alert').textContent, /refresh/);
            });
        });

        module('logged out', function () {
            test('displays alert', async function (assert) {
                this.server.post('/session', versionMismatchResponse);

                await visit('/signin');
                await fillIn('[name="identification"]', 'test@example.com');
                await fillIn('[name="password"]', 'password');
                await click('.js-login-button');

                // has the refresh to update alert
                assert.strictEqual(findAll('.gh-alert').length, 1);
                assert.match(find('.gh-alert').textContent, /refresh/);
            });
        });
    });

    module('CloudFlare errors', function (hooks) {
        hooks.beforeEach(async function () {
            this.server.loadFixtures();

            let roles = this.server.schema.roles.where({name: 'Administrator'});
            this.server.create('user', {roles});

            return await authenticateSession();
        });

        test('handles Ember Data HTML response', async function (assert) {
            this.server.put('/posts/1/', htmlErrorResponse);
            this.server.create('post');

            await visit('/editor/post/1');
            await click('[data-test-publishmenu-trigger]');
            await click('[data-test-publishmenu-save]');

            assert.strictEqual(findAll('.gh-alert').length, 1);
            assert.notMatch(find('.gh-alert').textContent, /html>/);
            assert.match(find('.gh-alert').textContent, /Request was rejected due to server error/);
        });

        test('handles ember-ajax HTML response', async function (assert) {
            this.server.del('/themes/foo/', htmlErrorResponse);

            await visit('/settings/design/change-theme');

            await click('[data-test-button="toggle-advanced"]');
            await click('[data-test-theme-id="foo"] [data-test-button="actions"]');
            await click('[data-test-actions-for="foo"] [data-test-button="delete"]');
            await click('[data-test-modal="delete-theme"] [data-test-button="confirm"]');

            assert.strictEqual(findAll('.gh-alert').length, 1);
            assert.notMatch(find('.gh-alert').textContent, /html>/);
            assert.match(find('.gh-alert').textContent, /Request was rejected due to server error/);
        });
    });
});
