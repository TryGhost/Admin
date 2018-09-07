import Mirage from 'ember-cli-mirage';
import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import destroyApp from '../../helpers/destroy-app';
import startApp from '../../helpers/start-app';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {authenticateSession, invalidateSession} from 'ghost-admin/tests/helpers/ember-simple-auth';
import {blur, click, currentURL, fillIn, find, findAll, triggerEvent, visit} from '@ember/test-helpers';
import {expect} from 'chai';

describe('Acceptance: Settings - Integrations - Slack', function () {
    let application;

    beforeEach(function () {
        application = startApp();
    });

    afterEach(function () {
        destroyApp(application);
    });

    it('redirects to signin when not authenticated', async function () {
        invalidateSession(application);
        await visit('/settings/integrations/slack');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to team page when authenticated as contributor', async function () {
        let role = server.create('role', {name: 'Contributor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/integrations/slack');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as author', async function () {
        let role = server.create('role', {name: 'Author'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/integrations/slack');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as editor', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/integrations/slack');

        expect(currentURL(), 'currentURL').to.equal('/team');
    });

    describe('when logged in', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return authenticateSession(application);
        });

        it('it validates and saves a slack url properly', async function () {
            await visit('/settings/integrations/slack');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/slack');

            await fillIn('[data-test-slack-url-input]', 'notacorrecturl');
            await click('[data-test-save-button]');

            expect(find('#slack-settings .error .response').textContent.trim(), 'inline validation response')
                .to.equal('The URL must be in a format like https://hooks.slack.com/services/<your personal key>');

            // CMD-S shortcut works
            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            let [newRequest] = server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(newRequest.requestBody);
            let [result] = JSON.parse(params.settings.findBy('key', 'slack').value);

            expect(result.url).to.equal('https://hooks.slack.com/services/1275958430');
            expect(find('#slack-settings .error .response').textContent.trim(), 'inline validation response')
                .to.equal('');

            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await click('[data-test-send-notification-button]');

            expect(findAll('.gh-notification').length, 'number of notifications').to.equal(1);
            expect(find('#slack-settings .error .response').textContent.trim(), 'inline validation response')
                .to.equal('');

            server.put('/settings/', function () {
                return new Mirage.Response(422, {}, {
                    errors: [
                        {
                            errorType: 'ValidationError',
                            message: 'Test error'
                        }
                    ]
                });
            });

            await click('.gh-notification .gh-notification-close');
            await click('[data-test-send-notification-button]');

            // we shouldn't try to send the test request if the save fails
            let [lastRequest] = server.pretender.handledRequests.slice(-1);
            expect(lastRequest.url).to.not.match(/\/slack\/test/);
            expect(findAll('.gh-notification').length, 'check slack notification after api validation error').to.equal(0);
        });

        it('warns when leaving without saving', async function () {
            await visit('/settings/integrations/slack');

            // has correct url
            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/slack');

            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await await blur('[data-test-slack-url-input]');

            await visit('/settings/design');

            expect(findAll('.fullscreen-modal').length, 'modal exists').to.equal(1);

            // Leave without saving
            await (click('.fullscreen-modal [data-test-leave-button]'), 'leave without saving');

            expect(currentURL(), 'currentURL').to.equal('/settings/design');

            await visit('/settings/integrations/slack');

            expect(currentURL(), 'currentURL').to.equal('/settings/integrations/slack');

            // settings were not saved
            expect(
                find('[data-test-slack-url-input]').textContent.trim(),
                'Slack Webhook URL'
            ).to.equal('');
        });
    });
});
