import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession,invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, find, findAll, triggerEvent} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Code-Injection', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/code-injection');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/code-injection');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to staff page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/code-injection');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/code-injection');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it renders, loads and saves editors correctly', async function (assert) {
            await visit('/settings/code-injection');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/code-injection', 'currentURL');

            // has correct page title
            assert.strictEqual(document.title, 'Settings - Code injection - Test Blog', 'page title');

            assert.strictEqual(find('[data-test-save-button]').textContent.trim(), 'Save', 'save button text');

            assert.strictEqual(findAll('#ghost-head .CodeMirror').length, 1, 'ghost head codemirror element');
            assert.dom('#ghost-head .CodeMirror').hasClass('cm-s-xq-light', 'ghost head editor theme');

            assert.strictEqual(findAll('#ghost-foot .CodeMirror').length, 1, 'ghost head codemirror element');
            assert.dom('#ghost-foot .CodeMirror').hasClass('cm-s-xq-light', 'ghost head editor theme');

            await click('[data-test-save-button]');

            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);

            assert.strictEqual(params.settings.findBy('key', 'codeinjection_head').value, '');
            assert.strictEqual(find('[data-test-save-button]').textContent.trim(), 'Save', 'save button text');

            // CMD-S shortcut works
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });
            // we've already saved in this test so there's no on-screen indication
            // that we've had another save, check the request was fired instead
            let [newRequest] = this.server.pretender.handledRequests.slice(-1);
            params = JSON.parse(newRequest.requestBody);

            assert.strictEqual(params.settings.findBy('key', 'codeinjection_head').value, '');
            assert.strictEqual(find('[data-test-save-button]').textContent.trim(), 'Save', 'save button text');
        });
    });
});
