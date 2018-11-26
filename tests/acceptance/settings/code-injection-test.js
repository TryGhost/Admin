import $ from 'jquery';
import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
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

describe('Acceptance: Settings - Code-Injection', function () {
    let application;

    beforeEach(function () {
        application = startApp();
    });

    afterEach(function () {
        destroyApp(application);
    });

    it('redirects to signin when not authenticated', async function () {
        invalidateSession(application);
        await visit('/settings/code-injection');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to team page when authenticated as contributor', async function () {
        let role = server.create('role', {name: 'Contributor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/code-injection');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as author', async function () {
        let role = server.create('role', {name: 'Author'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/code-injection');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as editor', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/code-injection');

        expect(currentURL(), 'currentURL').to.equal('/team');
    });

    describe('when logged in', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return authenticateSession(application);
        });

        it('it renders, loads and saves editors correctly', async function () {
            await visit('/settings/code-injection');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/code-injection');

            // has correct page title
            expect(document.title, 'page title').to.equal('Settings - Code injection - Test Blog');

            // highlights nav menu
            expect($('[data-test-nav="code-injection"]').hasClass('active'), 'highlights nav menu item')
                .to.be.true;

            expect(find('[data-test-save-button]').text().trim(), 'save button text').to.equal('Save');

            expect(find('#ghost-head .CodeMirror').length, 'ghost head codemirror element').to.equal(1);
            expect($('#ghost-head .CodeMirror').hasClass('cm-s-xq-light'), 'ghost head editor theme').to.be.true;

            expect(find('#ghost-foot .CodeMirror').length, 'ghost head codemirror element').to.equal(1);
            expect($('#ghost-foot .CodeMirror').hasClass('cm-s-xq-light'), 'ghost head editor theme').to.be.true;

            await click('[data-test-save-button]');

            let [lastRequest] = server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);

            expect(params.settings.findBy('key', 'ghost_head').value).to.equal('');
            expect(find('[data-test-save-button]').text().trim(), 'save button text').to.equal('Saved');

            // CMD-S shortcut works
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });
            // we've already saved in this test so there's no on-screen indication
            // that we've had another save, check the request was fired instead
            let [newRequest] = server.pretender.handledRequests.slice(-1);
            params = JSON.parse(newRequest.requestBody);

            expect(params.settings.findBy('key', 'ghost_head').value).to.equal('');
            expect(find('[data-test-save-button]').text().trim(), 'save button text').to.equal('Saved');
        });
    });
});
