import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {currentURL} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Integrations - Zapier', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/integrations/zapier');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to home page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it loads', async function (assert) {
            await visit('/settings/integrations/zapier');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/zapier', 'currentURL');
        });
    });
});
