import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentRouteName, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
import {module, skip, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Integrations - Custom', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('access permissions', function (hooks) {
        hooks.beforeEach(function () {
            this.server.create('integration', {name: 'Test'});
        });

        test('redirects /integrations/ to signin when not authenticated', async function (assert) {
            await invalidateSession();
            await visit('/settings/integrations');

            assert.strictEqual(currentURL(), '/signin', 'currentURL');
        });

        test('redirects /integrations/ to home page when authenticated as contributor', async function (assert) {
            let role = this.server.create('role', {name: 'Contributor'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations');

            assert.strictEqual(currentURL(), '/posts', 'currentURL');
        });

        test('redirects /integrations/ to home page when authenticated as author', async function (assert) {
            let role = this.server.create('role', {name: 'Author'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations');

            assert.strictEqual(currentURL(), '/site', 'currentURL');
        });

        test('redirects /integrations/ to home page when authenticated as editor', async function (assert) {
            let role = this.server.create('role', {name: 'Editor'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/site', 'currentURL');
        });

        test('redirects /integrations/:id/ to signin when not authenticated', async function (assert) {
            await invalidateSession();
            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/signin', 'currentURL');
        });

        test('redirects /integrations/:id/ to home page when authenticated as contributor', async function (assert) {
            let role = this.server.create('role', {name: 'Contributor'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/posts', 'currentURL');
        });

        test('redirects /integrations/:id/ to home page when authenticated as author', async function (assert) {
            let role = this.server.create('role', {name: 'Author'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/site', 'currentURL');
        });

        test('redirects /integrations/:id/ to home page when authenticated as editor', async function (assert) {
            let role = this.server.create('role', {name: 'Editor'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            await authenticateSession();
            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/site', 'currentURL');
        });
    });

    module('navigation', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('renders correctly', async function (assert) {
            await visit('/settings/integrations');

            // slack is not configured in the fixtures
            assert.strictEqual(find('[data-test-app="slack"] [data-test-app-status]').textContent.trim(), 'Configure', 'slack app status');

            // amp is enabled in the fixtures
            assert.strictEqual(find('[data-test-app="amp"] [data-test-app-status]').textContent.trim(), 'Active', 'amp app status');
        });

        test('it redirects to Slack when clicking on the grid', async function (assert) {
            await visit('/settings/integrations');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations', 'currentURL');

            await click('[data-test-link="slack"]');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/slack', 'currentURL');
        });

        test('it redirects to AMP when clicking on the grid', async function (assert) {
            await visit('/settings/integrations');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations', 'currentURL');

            await click('[data-test-link="amp"]');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/amp', 'currentURL');
        });

        test('it redirects to Unsplash when clicking on the grid', async function (assert) {
            await visit('/settings/integrations');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations', 'currentURL');

            await click('[data-test-link="unsplash"]');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/unsplash', 'currentURL');
        });
    });

    module('custom integrations', function (hooks) {
        hooks.beforeEach(async function () {
            this.server.loadFixtures('configs');
            let config = this.server.schema.configs.first();
            config.update({
                enableDeveloperExperiments: true
            });

            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('handles 404', async function (assert) {
            await visit('/settings/integrations/1');
            assert.strictEqual(currentRouteName(), 'error404');
        });

        test('can add new integration', async function (assert) {
            // sanity check
            assert.strictEqual(this.server.db.integrations.length, 0, 'number of integrations in db at start');
            assert.strictEqual(this.server.db.apiKeys.length, 0, 'number of apiKeys in db at start');

            // blank slate
            await visit('/settings/integrations');

            assert.dom('[data-test-blank="custom-integrations"]').exists('initial blank slate');

            // new integration modal opens/closes
            await click('[data-test-button="new-integration"]');

            assert.strictEqual(currentURL(), '/settings/integrations/new', 'url after clicking new');
            assert.dom('[data-test-modal="new-integration"]').exists('modal after clicking new');

            await click('[data-test-button="cancel-new-integration"]');

            assert.dom('[data-test-modal="new-integration"]').doesNotExist('modal after clicking cancel');

            assert.dom('[data-test-blank="custom-integrations"]').exists('blank slate after cancelled creation');

            // new integration validations
            await click('[data-test-button="new-integration"]');
            await click('[data-test-button="create-integration"]');

            assert.dom('[data-test-error="new-integration-name"]').containsText('enter a name', 'name error after create with blank field');

            await fillIn('[data-test-input="new-integration-name"]', 'Duplicate');
            await click('[data-test-button="create-integration"]');

            assert.dom('[data-test-error="new-integration-name"]').containsText('already been used', 'name error after create with duplicate name');

            // successful creation
            await fillIn('[data-test-input="new-integration-name"]', 'Test');

            assert.notOk(find('[data-test-error="new-integration-name"]').textContent.trim(), 'name error after typing in field');

            await click('[data-test-button="create-integration"]');

            assert.dom('[data-test-modal="new-integration"]').doesNotExist('modal after successful create');

            assert.strictEqual(this.server.db.integrations.length, 1, 'number of integrations in db after create');
            // mirage sanity check
            assert.strictEqual(this.server.db.apiKeys.length, 2, 'number of api keys in db after create');

            assert.strictEqual(currentURL(), '/settings/integrations/1', 'url after integration creation');

            // test navigation back to list then back to new integration
            await click('[data-test-link="integrations-back"]');

            assert.strictEqual(currentURL(), '/settings/integrations', 'url after clicking "Back"');

            assert.dom('[data-test-blank="custom-integrations"]').doesNotExist('blank slate after creation');

            assert.strictEqual(findAll('[data-test-custom-integration]').length, 1, 'number of custom integrations after creation');

            await click(`[data-test-integration="1"]`);

            assert.strictEqual(currentURL(), '/settings/integrations/1', 'url after clicking integration in list');
        });

        skip('can manage an integration', async function (assert) {
            this.server.create('integration');

            await visit('/settings/integrations/1');

            assert.strictEqual(currentURL(), '/settings/integrations/1', 'initial URL');

            assert.includes(find('[data-test-screen-title]').textContent, 'Integration 1', 'screen title');

            // fields have expected values
            // TODO: add test for logo

            assert.strictEqual(find('[data-test-input="name"]').value, 'Integration 1', 'initial name value');

            assert.strictEqual(find('[data-test-input="description"]').value, '', 'initial description value');

            assert.dom('[data-test-text="content-key"]').hasText('integration-1_content_key-12345', 'content key text');

            assert.dom('[data-test-text="admin-key"]').hasText('integration-1_admin_key-12345', 'admin key text');

            assert.dom('[data-test-text="api-url"]').hasText(window.location.origin, 'api url text');

            // it can modify integration fields and has validation

            assert.notOk(find('[data-test-error="name"]').textContent.trim(), 'initial name error');

            await fillIn('[data-test-input="name"]', '');
            await await blur('[data-test-input="name"]');

            assert.includes(find('[data-test-error="name"]').textContent, 'enter a name', 'name validation for blank string');

            await click('[data-test-button="save"]');

            assert.strictEqual(this.server.schema.integrations.first().name, 'Integration 1', 'db integration name after failed save');

            await fillIn('[data-test-input="name"]', 'Test Integration');
            await await blur('[data-test-input="name"]');

            assert.notOk(find('[data-test-error="name"]').textContent.trim(), 'name error after valid entry');

            await fillIn('[data-test-input="description"]', 'Description for Test Integration');
            await await blur('[data-test-input="description"]');
            await click('[data-test-button="save"]');

            // changes are reflected in the integrations list

            await click('[data-test-link="integrations-back"]');

            assert.strictEqual(currentURL(), '/settings/integrations', 'url after saving and clicking "back"');

            assert.strictEqual(find('[data-test-integration="1"] [data-test-text="name"]').textContent.trim(), 'Test Integration', 'integration name after save');

            assert.strictEqual(find('[data-test-integration="1"] [data-test-text="description"]').textContent.trim(), 'Description for Test Integration', 'integration description after save');

            await click('[data-test-integration="1"]');

            // warns of unsaved changes when leaving

            await fillIn('[data-test-input="name"]', 'Unsaved test');
            await click('[data-test-link="integrations-back"]');

            assert.dom('[data-test-modal="unsaved-settings"]').exists('modal shown when navigating with unsaved changes');

            await click('[data-test-stay-button]');

            assert.dom('[data-test-modal="unsaved-settings"]').doesNotExist('modal is closed after clicking "stay"');

            assert.strictEqual(currentURL(), '/settings/integrations/1', 'url after clicking "stay"');

            await click('[data-test-link="integrations-back"]');
            await click('[data-test-leave-button]');

            assert.dom('[data-test-modal="unsaved-settings"]').doesNotExist('modal is closed after clicking "leave"');

            assert.strictEqual(currentURL(), '/settings/integrations', 'url after clicking "leave"');

            assert.strictEqual(find('[data-test-integration="1"] [data-test-text="name"]').textContent.trim(), 'Test Integration', 'integration name after leaving unsaved changes');
        });

        test('can manage an integration\'s webhooks', async function (assert) {
            this.server.create('integration');

            await visit('/settings/integrations/1');

            assert.dom('[data-test-webhooks-blank-slate]').exists();

            // open new webhook modal
            await click('[data-test-link="add-webhook"]');
            assert.dom('[data-test-modal="webhook-form"]').exists();
            assert.dom(find('[data-test-modal="webhook-form"] [data-test-text="title"]')).containsText('New webhook');

            // can cancel new webhook
            await click('[data-test-button="cancel-webhook"]');
            assert.dom('[data-test-modal="webhook-form"]').doesNotExist();

            // create new webhook
            await click('[data-test-link="add-webhook"]');
            await fillIn('[data-test-input="webhook-name"]', 'First webhook');
            await fillIn('[data-test-select="webhook-event"]', 'site.changed');
            await fillIn('[data-test-input="webhook-targetUrl"]', 'https://example.com/first-webhook');
            await click('[data-test-button="save-webhook"]');

            // modal closed and 1 webhook listed with correct details
            assert.dom('[data-test-modal="webhook-form"]').doesNotExist();
            assert.dom('[data-test-webhook-row]').exists();
            let row = find('[data-test-webhook-row="1"]');
            assert.dom(row.querySelector('[data-test-text="name"]')).containsText('First webhook');
            assert.dom(row.querySelector('[data-test-text="event"]')).containsText('Site changed (rebuild)');
            assert.dom(row.querySelector('[data-test-text="targetUrl"]')).containsText('https://example.com/first-webhook');
            assert.dom(row.querySelector('[data-test-text="last-triggered"]')).containsText('Not triggered');

            // click edit webhook link
            await click('[data-test-webhook-row="1"] [data-test-link="edit-webhook"]');

            // modal appears and has correct title
            assert.dom('[data-test-modal="webhook-form"]').exists();
            assert.dom(find('[data-test-modal="webhook-form"] [data-test-text="title"]')).containsText('Edit webhook');
        });

        // test to ensure the `value=description` passed to `gh-text-input` is `readonly`
        test('doesn\'t show unsaved changes modal after placing focus on description field', async function (assert) {
            this.server.create('integration');

            await visit('/settings/integrations/1');
            await click('[data-test-input="description"]');
            await await blur('[data-test-input="description"]');
            await click('[data-test-link="integrations-back"]');

            assert.dom('[data-test-modal="unsaved-settings"]').doesNotExist('unsaved changes modal is not shown');

            assert.strictEqual(currentURL(), '/settings/integrations');
        });
    });
});
