import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, find, findAll, triggerEvent} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Integrations - Unsplash', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/integrations/unsplash');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/unsplash');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to home page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/unsplash');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/unsplash');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it can activate/deactivate', async function (assert) {
            await visit('/settings/integrations/unsplash');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/unsplash', 'currentURL');

            // it's enabled by default when settings is empty
            assert.true(find('[data-test-unsplash-checkbox]').checked, 'checked by default');

            await click('[data-test-unsplash-checkbox]');

            assert.false(find('[data-test-unsplash-checkbox]').checked, 'unsplash checkbox');

            // trigger a save
            await click('[data-test-save-button]');

            // server should now have an unsplash setting
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);

            assert.false(params.settings.findBy('key', 'unsplash').value);

            // save via CMD-S shortcut
            await click('[data-test-unsplash-checkbox]');
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            // we've already saved in this test so there's no on-screen indication
            // that we've had another save, check the request was fired instead
            let [newRequest] = this.server.pretender.handledRequests.slice(-1);
            params = JSON.parse(newRequest.requestBody);

            assert.true(find('[data-test-unsplash-checkbox]').checked, 'AMP checkbox');
            assert.true(params.settings.findBy('key', 'unsplash').value);
        });

        test('warns when leaving without saving', async function (assert) {
            await visit('/settings/integrations/unsplash');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/unsplash', 'currentURL');

            // AMP is enabled by default
            assert.true(find('[data-test-unsplash-checkbox]').checked, 'AMP checkbox default');

            await click('[data-test-unsplash-checkbox]');

            assert.false(find('[data-test-unsplash-checkbox]').checked, 'Unsplash checkbox');

            await visit('/settings/labs');

            assert.strictEqual(findAll('.fullscreen-modal').length, 1, 'unsaved changes modal exists');

            // Leave without saving
            await click('.fullscreen-modal [data-test-leave-button]');

            assert.strictEqual(currentURL(), '/settings/labs', 'currentURL after leave without saving');

            await visit('/settings/integrations/unsplash');

            assert.strictEqual(currentURL(), '/settings/integrations/unsplash', 'currentURL');

            // settings were not saved
            assert.true(find('[data-test-unsplash-checkbox]').checked, 'Unsplash checkbox');
        });
    });
});
