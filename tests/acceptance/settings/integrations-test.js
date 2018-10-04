import destroyApp from '../../helpers/destroy-app';
import startApp from '../../helpers/start-app';
import {
    afterEach,
    beforeEach,
    describe,
    it
} from 'mocha';
import {authenticateSession, invalidateSession} from 'ghost-admin/tests/helpers/ember-simple-auth';
import {expect} from 'chai';

describe('Acceptance: Settings - Integrations', function () {
    let application;

    beforeEach(function () {
        application = startApp();
    });

    afterEach(function () {
        destroyApp(application);
    });

    describe('access permissions', function () {
        it('redirects to signin when not authenticated', async function () {
            invalidateSession(application);
            await visit('/settings/integrations');

            expect(currentURL(), 'currentURL').to.equal('/signin');
        });

        it('redirects to team page when authenticated as contributor', async function () {
            let role = server.create('role', {name: 'Contributor'});
            server.create('user', {roles: [role], slug: 'test-user'});

            authenticateSession(application);
            await visit('/settings/integrations');

            expect(currentURL(), 'currentURL').to.equal('/team/test-user');
        });

        it('redirects to team page when authenticated as author', async function () {
            let role = server.create('role', {name: 'Author'});
            server.create('user', {roles: [role], slug: 'test-user'});

            authenticateSession(application);
            await visit('/settings/integrations');

            expect(currentURL(), 'currentURL').to.equal('/team/test-user');
        });

        it('redirects to team page when authenticated as editor', async function () {
            let role = server.create('role', {name: 'Editor'});
            server.create('user', {roles: [role], slug: 'test-user'});

            authenticateSession(application);
            await visit('/settings/integrations');

            expect(currentURL(), 'currentURL').to.equal('/team');
        });
    });

    describe('navigation', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return authenticateSession(application);
        });

        it('renders correctly', async function () {
            await visit('/settings/integrations');

            // slack is not configured in the fixtures
            expect(
                find('[data-test-app="slack"] [data-test-app-status]').text().trim(),
                'slack app status'
            ).to.equal('Configure');

            // amp is enabled in the fixtures
            expect(
                find('[data-test-app="amp"] [data-test-app-status]').text().trim(),
                'amp app status'
            ).to.equal('Active');
        });

        it('it redirects to Slack when clicking on the grid', async function () {
            await visit('/settings/integrations');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations');

            await click('[data-test-link="slack"]');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/slack');
        });

        it('it redirects to AMP when clicking on the grid', async function () {
            await visit('/settings/integrations');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations');

            await click('[data-test-link="amp"]');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/amp');
        });

        it('it redirects to Unsplash when clicking on the grid', async function () {
            await visit('/settings/integrations');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations');

            await click('[data-test-link="unsplash"]');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/unsplash');
        });
    });

    describe('custom integrations', function () {
        beforeEach(function () {
            server.loadFixtures('configurations');
            let config = server.schema.configurations.first();
            config.update({
                enableDeveloperExperiments: true
            });

            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return authenticateSession(application);
        });

        it('can add new integration', async function () {
            // sanity check
            expect(
                server.db.integrations.length,
                'number of integrations in db at start'
            ).to.equal(0);

            await visit('/settings/integrations');

            expect(
                find('[data-test-blank="custom-integrations"]'),
                'initial blank slate'
            ).to.exist;

            await click('[data-test-button="new-integration"]');

            expect(currentURL(), 'url after clicking new').to.equal('/settings/integrations/new');
            expect(find('[data-test-modal="new-integration"]'), 'modal after clicking new').to.exist;

            await click('[data-test-button="cancel-new-integration"]');

            expect(find('[data-test-modal="new-integration"]'), 'modal after clicking cancel')
                .to.not.exist;

            // TODO: test that the unsaved integration is not shown in the list

            await click('[data-test-button="new-integration"]');
            await click('[data-test-button="create-integration"]');

            expect(
                find('[data-test-error="new-integration-name"]').text(),
                'name error after create with blank field'
            ).to.have.string('enter a name');

            await fillIn('[data-test-input="new-integration-name"]', 'Test');

            expect(
                find('[data-test-error="new-integration-name"]').text().trim(),
                'name error after typing in field'
            ).to.be.empty;

            await click('[data-test-button="create-integration"]');

            expect(
                find('[data-test-modal="new-integration"]'),
                'modal after successful create'
            ).to.not.exist;

            expect(
                server.db.integrations.length,
                'number of integrations in db after create'
            ).to.equal(1);

            // TODO: test that the new integration is listed
            // TODO: test that the new integration can be navigated to
        });
    });
});
