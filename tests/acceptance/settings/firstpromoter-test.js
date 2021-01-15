import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {
    beforeEach,
    describe,
    it
} from 'mocha';
import {click, currentURL, find, findAll, triggerEvent} from '@ember/test-helpers';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

describe('Acceptance: Settings - Integrations - FirstPromoter', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    it('redirects to signin when not authenticated', async function () {
        await invalidateSession();
        await visit('/settings/integrations/firstpromoter');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to staff page when authenticated as contributor', async function () {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/firstpromoter');

        expect(currentURL(), 'currentURL').to.equal('/staff/test-user');
    });

    it('redirects to staff page when authenticated as author', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/firstpromoter');

        expect(currentURL(), 'currentURL').to.equal('/staff/test-user');
    });

    it('redirects to staff page when authenticated as editor', async function () {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/firstpromoter');

        expect(currentURL(), 'currentURL').to.equal('/staff');
    });

    describe('when logged in', function () {
        beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        it('it enables or disables FirstPromoter properly and saves it', async function () {
            await visit('/settings/integrations/firstpromoter');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/firstpromoter');

            // FirstPromoter is enabled by default
            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox').to.be.false;

            await click('[data-test-firstpromoter-checkbox]');

            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox').to.be.true;

            await click('[data-test-save-button]');

            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);

            expect(params.settings.findBy('key', 'firstpromoter').value).to.equal(true);

            // CMD-S shortcut works
            await click('[data-test-firstpromoter-checkbox]');
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            // we've already saved in this test so there's no on-screen indication
            // that we've had another save, check the request was fired instead
            let [newRequest] = this.server.pretender.handledRequests.slice(-1);
            params = JSON.parse(newRequest.requestBody);

            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox').to.be.false;
            expect(params.settings.findBy('key', 'firstpromoter').value).to.equal(false);
        });

        it('warns when leaving without saving', async function () {
            await visit('/settings/integrations/firstpromoter');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/firstpromoter');

            // FirstPromoter is enabled by default
            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox default').to.be.true;

            await click('[data-test-firstpromoter-checkbox]');

            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox after click').to.be.false;

            await visit('/staff');

            expect(findAll('.fullscreen-modal').length, 'unsaved changes modal exists').to.equal(1);

            // Leave without saving
            await click('.fullscreen-modal [data-test-leave-button]');

            expect(currentURL(), 'currentURL after leave without saving').to.equal('/staff');

            await visit('/settings/integrations/firstpromoter');

            expect(currentURL(), 'currentURL after return').to.equal('/settings/integrations/firstpromoter');

            // settings were not saved
            expect(find('[data-test-firstpromoter-checkbox]').checked, 'FirstPromoter checkbox').to.be.true;
        });
    });
});
