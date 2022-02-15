import Mirage from 'ember-cli-mirage';
import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession,invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentURL, fillIn, find, findAll, triggerEvent} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Integrations - Slack', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/integrations/slack');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/slack');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to home page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/slack');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/integrations/slack');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it validates and saves slack settings properly', async function (assert) {
            await visit('/settings/integrations/slack');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/slack', 'currentURL');

            await fillIn('[data-test-slack-url-input]', 'notacorrecturl');
            await click('[data-test-save-button]');

            assert.strictEqual(find('[data-test-error="slack-url"]').textContent.trim(), 'The URL must be in a format like https://hooks.slack.com/services/<your personal key>', 'inline validation response');

            // CMD-S shortcut works
            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await fillIn('[data-test-slack-username-input]', 'SlackBot');
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            let [newRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(newRequest.requestBody);
            let [result] = JSON.parse(params.settings.findBy('key', 'slack').value);

            assert.strictEqual(result.url, 'https://hooks.slack.com/services/1275958430');
            assert.strictEqual(result.username, 'SlackBot');
            assert.dom('[data-test-error="slack-url"]').doesNotExist('inline validation response');

            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await click('[data-test-send-notification-button]');

            assert.strictEqual(findAll('.gh-notification').length, 1, 'number of notifications');
            assert.dom('[data-test-error="slack-url"]').doesNotExist('inline validation response');

            this.server.put('/settings/', function () {
                return new Mirage.Response(422, {}, {
                    errors: [
                        {
                            type: 'ValidationError',
                            message: 'Test error'
                        }
                    ]
                });
            });

            await click('.gh-notification .gh-notification-close');
            await click('[data-test-send-notification-button]');

            // we shouldn't try to send the test request if the save fails
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            assert.notMatch(lastRequest.url, /\/slack\/test/);
            assert.strictEqual(findAll('.gh-notification').length, 0, 'check slack notification after api validation error');
        });

        test('warns when leaving without saving', async function (assert) {
            await visit('/settings/integrations/slack');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/integrations/slack', 'currentURL');

            await fillIn('[data-test-slack-url-input]', 'https://hooks.slack.com/services/1275958430');
            await blur('[data-test-slack-url-input]');

            await visit('/settings');

            assert.strictEqual(findAll('.fullscreen-modal').length, 1, 'modal exists');

            // Leave without saving
            await click('.fullscreen-modal [data-test-leave-button]');

            assert.strictEqual(currentURL(), '/settings', 'currentURL');

            await visit('/settings/integrations/slack');

            assert.strictEqual(currentURL(), '/settings/integrations/slack', 'currentURL');

            // settings were not saved
            assert.strictEqual(find('[data-test-slack-url-input]').textContent.trim(), '', 'Slack Webhook URL');
        });
    });
});
