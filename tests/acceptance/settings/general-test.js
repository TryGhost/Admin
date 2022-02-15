import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentURL, fillIn, find, findAll, focus, triggerEvent} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - General', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/general');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/general');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to home page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/general');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/general');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it renders, handles image uploads', async function (assert) {
            await visit('/settings/general');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/general', 'currentURL');

            // has correct page title
            assert.strictEqual(document.title, 'Settings - General - Test Blog', 'page title');

            // highlights nav menu
            assert.dom('[data-test-nav="settings"]').hasClass('active', 'highlights nav menu item');

            assert.strictEqual(find('[data-test-button="save"]').textContent.trim(), 'Save', 'save button text');

            await click('[data-test-toggle-pub-info]');
            await fillIn('[data-test-title-input]', 'New Blog Title');
            await click('[data-test-button="save"]');
            assert.strictEqual(document.title, 'Settings - General - New Blog Title', 'page title');

            // CMD-S shortcut works
            // -------------------------------------------------------------- //
            await fillIn('[data-test-title-input]', 'CMD-S Test');
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });
            // we've already saved in this test so there's no on-screen indication
            // that we've had another save, check the request was fired instead
            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);
            assert.strictEqual(params.settings.findBy('key', 'title').value, 'CMD-S Test');
        });

        test('renders timezone selector correctly', async function (assert) {
            await visit('/settings/general');
            await click('[data-test-toggle-timezone]');

            assert.strictEqual(currentURL(), '/settings/general', 'currentURL');

            assert.strictEqual(findAll('#timezone option').length, 66, 'available timezones');
            assert.strictEqual(find('#timezone option:checked').textContent.trim(), '(GMT) UTC');
            find('#timezone option[value="Africa/Cairo"]').selected = true;

            await triggerEvent('#timezone', 'change');
            await click('[data-test-button="save"]');
            assert.strictEqual(find('#timezone option:checked').textContent.trim(), '(GMT +2:00) Cairo, Egypt');
        });

        test('handles private blog settings correctly', async function (assert) {
            await visit('/settings/general');

            // handles private blog settings correctly
            assert.false(find('[data-test-private-checkbox]').checked, 'isPrivate checkbox');

            await click('[data-test-private-checkbox]');

            assert.true(find('[data-test-private-checkbox]').checked, 'isPrivate checkbox');
            assert.strictEqual(findAll('[data-test-password-input]').length, 1, 'password input');
            assert.notEqual(find('[data-test-password-input]').value, '', 'password default value');

            await fillIn('[data-test-password-input]', '');
            await blur('[data-test-password-input]');

            assert.strictEqual(find('[data-test-password-error]').textContent.trim(), 'Password must be supplied', 'empty password error');

            await fillIn('[data-test-password-input]', 'asdfg');
            await blur('[data-test-password-input]');

            assert.strictEqual(find('[data-test-password-error]').textContent.trim(), '', 'present password error');
        });

        // eslint-disable-next-line qunit/require-expect
        test('handles social blog settings correctly', async function (assert) {
            let testSocialInput = async function (type, input, expectedValue, expectedError = '') {
                await fillIn(`[data-test-${type}-input]`, input);
                await blur(`[data-test-${type}-input]`);

                assert.strictEqual(find(`[data-test-${type}-input]`).value, expectedValue, `${type} value for ${input}`);

                assert.strictEqual(find(`[data-test-${type}-error]`).textContent.trim(), expectedError, `${type} validation response for ${input}`);

                assert.strictEqual(find(`[data-test-${type}-input]`).closest('.form-group').classList.contains('error'), !!expectedError, `${type} input should be in error state with '${input}'`);
            };

            let testFacebookValidation = async (...args) => testSocialInput('facebook', ...args);
            let testTwitterValidation = async (...args) => testSocialInput('twitter', ...args);

            await visit('/settings/general');
            await click('[data-test-toggle-social]');

            // validates a facebook url correctly
            // loads fixtures and performs transform
            assert.strictEqual(find('[data-test-facebook-input]').value, 'https://www.facebook.com/test', 'initial facebook value');

            await focus('[data-test-facebook-input]');
            await blur('[data-test-facebook-input]');

            // regression test: we still have a value after the input is
            // focused and then blurred without any changes
            assert.strictEqual(find('[data-test-facebook-input]').value, 'https://www.facebook.com/test', 'facebook value after blur with no change');

            await testFacebookValidation(
                'facebook.com/username',
                'https://www.facebook.com/username');

            await testFacebookValidation(
                'testuser',
                'https://www.facebook.com/testuser');

            await testFacebookValidation(
                'ab99',
                'https://www.facebook.com/ab99');

            await testFacebookValidation(
                'page/ab99',
                'https://www.facebook.com/page/ab99');

            await testFacebookValidation(
                'page/*(&*(%%))',
                'https://www.facebook.com/page/*(&*(%%))');

            await testFacebookValidation(
                'facebook.com/pages/some-facebook-page/857469375913?ref=ts',
                'https://www.facebook.com/pages/some-facebook-page/857469375913?ref=ts');

            await testFacebookValidation(
                'https://www.facebook.com/groups/savethecrowninn',
                'https://www.facebook.com/groups/savethecrowninn');

            await testFacebookValidation(
                'http://github.com/username',
                'http://github.com/username',
                'The URL must be in a format like https://www.facebook.com/yourPage');

            await testFacebookValidation(
                'http://github.com/pages/username',
                'http://github.com/pages/username',
                'The URL must be in a format like https://www.facebook.com/yourPage');

            // validates a twitter url correctly

            // loads fixtures and performs transform
            assert.strictEqual(find('[data-test-twitter-input]').value, 'https://twitter.com/test', 'initial twitter value');

            await focus('[data-test-twitter-input]');
            await blur('[data-test-twitter-input]');

            // regression test: we still have a value after the input is
            // focused and then blurred without any changes
            assert.strictEqual(find('[data-test-twitter-input]').value, 'https://twitter.com/test', 'twitter value after blur with no change');

            await testTwitterValidation(
                'twitter.com/username',
                'https://twitter.com/username');

            await testTwitterValidation(
                'testuser',
                'https://twitter.com/testuser');

            await testTwitterValidation(
                'http://github.com/username',
                'https://twitter.com/username');

            await testTwitterValidation(
                '*(&*(%%))',
                '*(&*(%%))',
                'The URL must be in a format like https://twitter.com/yourUsername');

            await testTwitterValidation(
                'thisusernamehasmorethan15characters',
                'thisusernamehasmorethan15characters',
                'Your Username is not a valid Twitter Username');
        });

        test('warns when leaving without saving', async function (assert) {
            await visit('/settings/general');

            assert.false(find('[data-test-private-checkbox]').checked, 'private blog checkbox');

            await click('[data-test-toggle-pub-info]');
            await fillIn('[data-test-title-input]', 'New Blog Title');

            await click('[data-test-private-checkbox]');

            assert.true(find('[data-test-private-checkbox]').checked, 'private blog checkbox');

            await visit('/settings/staff');

            assert.strictEqual(findAll('.fullscreen-modal').length, 1, 'modal exists');

            // Leave without saving
            await click('.fullscreen-modal [data-test-leave-button]');

            assert.strictEqual(currentURL(), '/settings/staff', 'currentURL');

            await visit('/settings/general');

            assert.strictEqual(currentURL(), '/settings/general', 'currentURL');

            // settings were not saved
            assert.false(find('[data-test-private-checkbox]').checked, 'private blog checkbox');

            assert.strictEqual(find('[data-test-title-input]').textContent.trim(), '', 'Blog title');
        });
    });
});
