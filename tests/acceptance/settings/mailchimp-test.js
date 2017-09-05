import destroyApp from 'ghost-admin/tests/helpers/destroy-app';
import moment from 'moment';
import startApp from 'ghost-admin/tests/helpers/start-app';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {authenticateSession, invalidateSession} from 'ghost-admin/tests/helpers/ember-simple-auth';
import {click, fillIn, find, triggerEvent} from 'ember-native-dom-helpers';
import {expect} from 'chai';
import {timeout} from 'ember-concurrency';

describe('Acceptance: Settings - Apps - Mailchimp', function() {
    let application;

    beforeEach(function() {
        application = startApp();
    });

    afterEach(function() {
        destroyApp(application);
    });

    it('redirects to signin when not authenticated', async function () {
        invalidateSession(application);
        await visit('/settings/apps/mailchimp');

        expect(currentURL(), 'currentURL').to.equal('/signin');
    });

    it('redirects to team page when authenticated as author', async function () {
        let role = server.create('role', {name: 'Author'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/apps/mailchimp');

        expect(currentURL(), 'currentURL').to.equal('/team/test-user');
    });

    it('redirects to team page when authenticated as editor', async function () {
        let role = server.create('role', {name: 'Editor'});
        server.create('user', {roles: [role], slug: 'test-user'});

        authenticateSession(application);
        await visit('/settings/apps/mailchimp');

        expect(currentURL(), 'currentURL').to.equal('/team');
    });

    describe('when logged in', function () {
        beforeEach(function () {
            let role = server.create('role', {name: 'Administrator'});
            server.create('user', {roles: [role]});

            return authenticateSession(application);
        });

        it('can be set up from a blank state', async function () {
            // set mailchimp setting to the default API fixture value
            server.db.settings.update({key: 'mailchimp'}, {value: '{"isActive": false, "apiKey": "", "activeList": {}}'});

            await visit('/settings/apps/mailchimp');

            // verify initial state
            expect(find('[data-test-checkbox="isActive"]').checked, 'initial checkbox state').to.be.false;
            expect(find('[data-test-input="apiKey"]').value, 'initial api field value').to.be.blank;
            expect(find('[data-test-select="lists"]'), 'initial lists select state').to.not.exist;

            // adding api key with spaces shows invalid api key error
            await fillIn('[data-test-input="apiKey"]', 'invalid key');
            await triggerEvent('[data-test-input="apiKey"]', 'blur');
            expect(
                find('[data-test-error="apiKey"]').textContent,
                'apiKey error with invalid key format'
            ).to.have.string('valid API key');

            // adding invalid api key shows error from server
            await fillIn('[data-test-input="apiKey"]', 'invalid');
            await triggerEvent('[data-test-input="apiKey"]', 'blur');
            expect(
                find('[data-test-error="apiKey"]').textContent,
                'apiKey error with invalid key'
            ).to.have.string('API key is invalid');

            // adding valid api key removes errors and loads/shows list select
            await fillIn('[data-test-input="apiKey"]', 'valid');
            await triggerEvent('[data-test-input="apiKey"]', 'blur');
            expect(
                find('[data-test-error="apiKey"]'),
                'apiKey error when valid'
            ).to.not.exist;

            let select = find('[data-test-select="lists"]');

            expect(select, 'lists select element').to.exist;
            expect(select.options.length, 'number of options').to.equal(2);
            expect(select.options.item(0).value, 'first item value').to.equal('test1');
            expect(select.options.item(0).text, 'first item text').to.equal('Test List One');
            expect(select.options.item(1).value, 'second item value').to.equal('test2');
            expect(select.options.item(1).text, 'second item text').to.equal('Test List Two');

            // enabling and hitting save updates the settings value and polls for updates
            // request 1 = refresh after settings save
            // request 2 = first poll request
            // request 3 = second poll request
            let requestCount = 0;
            server.get('/settings/', function ({db}) {
                requestCount++;

                // update nextSyncAt on second request to simulate background sync
                if (requestCount === 3) {
                    let lastSyncAt = moment().valueOf();
                    let nextSyncAt = moment().add(24, 'hours').valueOf();
                    db.settings.update({key: 'scheduling'}, {value: `{"readonly":true,"subscribers":{"lastSyncAt":${lastSyncAt},"nextSyncAt":${nextSyncAt}}}`});
                }

                return {
                    settings: db.settings
                };
            });

            await click('[data-test-checkbox="isActive"]');
            let promise = click('[data-test-button="save"]');

            await timeout(50);
            expect(
                find('[data-test-button="save"]').textContent,
                'syncing button text'
            ).to.have.string('Syncing');

            // wait for the save/sync to settle
            await promise;

            expect(
                server.db.settings.findBy({key: 'mailchimp'}).value,
                'mailchimp settings after save'
            ).to.equal('{"isActive":true,"apiKey":"valid","activeList":{"id":"test1","name":"Test List One"}}');
        });

        it('resets `activeList` after changing API key', async function () {
            await visit('/settings/apps/mailchimp');
            await fillIn('[data-test-input="apiKey"]', 'valid2');
            await triggerEvent('[data-test-input="apiKey"]', 'blur');

            expect(find('[data-test-select="lists"]').value).to.equal('test3');

            // changing list and hitting save polls for background sync
            // request 1 = refresh after settings save
            // request 2 = first poll request
            let requestCount = 0;
            server.get('/settings/', function ({db}) {
                requestCount++;

                // update nextSyncAt on second request to simulate background sync
                if (requestCount === 2) {
                    let lastSyncAt = moment().valueOf();
                    let nextSyncAt = moment().add(24, 'hours').valueOf();
                    db.settings.update({key: 'scheduling'}, {value: `{"readonly":true,"subscribers":{"lastSyncAt":${lastSyncAt},"nextSyncAt":${nextSyncAt}}}`});
                }

                return {
                    settings: db.settings
                };
            });

            await click('[data-test-button="save"]');

            expect(
                server.db.settings.findBy({key: 'mailchimp'}).value
            ).to.equal('{"isActive":true,"apiKey":"valid2","activeList":{"id":"test3","name":"Test List Three"}}');

            // we should have at least one poll request for settings
            expect(requestCount).to.equal(2);
        });
    });
});
