import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {
    beforeEach,
    describe,
    it
} from 'mocha';
import {currentURL} from '@ember/test-helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {visit} from '../../helpers/visit';

describe('Acceptance: Settings - Integrations - Zapier', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/settings/integrations/zapier');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to team page when authenticated as contributor', async function () {
        let role = server.create('role', {name: 'Contributor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as author', async function () {
        let role = server.create('role', {name: 'Author'});
        server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as editor', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/zapier');

        expect(currentURL(), 'currentURL').to.equal('/team');
    });

    describe('when logged in', function () {
        beforeEach(async function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        it('it loads', async function () {
            await visit('/settings/integrations/zapier');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/zapier');
        });
    });
});
