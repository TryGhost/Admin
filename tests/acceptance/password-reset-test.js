import {click, fillIn, find, findAll, visit} from '@ember/test-helpers';
import {invalidateSession} from 'ember-simple-auth/test-support';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';

module('Acceptance: Password Reset', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('request reset', function () {
        test('is successful with valid data', async function (assert) {
            await invalidateSession();
            await visit('/signin');
            await fillIn('input[name="identification"]', 'test@example.com');
            await click('.forgotten-link');

            // an alert with instructions is displayed
            assert.strictEqual(findAll('.gh-alert-blue').length, 1, 'alert count');
        });

        test('shows error messages with invalid data', async function (assert) {
            await visit('/signin');

            // no email provided
            await click('.forgotten-link');

            // email field is invalid
            assert.match(find('input[name="identification"]').closest('.form-group'), '.error', 'email field has error class (no email)');

            // password field is valid
            assert.notMatch(find('input[name="password"]').closest('.form-group'), '.error', 'password field has error class (no email)');

            // error message shown
            assert.strictEqual(find('p.main-error').textContent.trim(), 'We need your email address to reset your password!', 'error message');

            // invalid email provided
            await fillIn('input[name="identification"]', 'test');
            await click('.forgotten-link');

            // email field is invalid
            assert.match(find('input[name="identification"]').closest('.form-group'), '.error', 'email field has error class (invalid email)');

            // password field is valid
            assert.notMatch(find('input[name="password"]').closest('.form-group'), '.error', 'password field has error class (invalid email)');

            // error message
            assert.strictEqual(find('p.main-error').textContent.trim(), 'We need your email address to reset your password!', 'error message');

            // unknown email provided
            await fillIn('input[name="identification"]', 'unknown@example.com');
            await click('.forgotten-link');

            // email field is invalid
            assert.match(find('input[name="identification"]').closest('.form-group'), '.error', 'email field has error class (unknown email)');

            // password field is valid
            assert.notMatch(find('input[name="password"]').closest('.form-group'), '.error', 'password field has error class (unknown email)');

            // error message
            assert.strictEqual(find('p.main-error').textContent.trim(), 'There is no user with that email address.', 'error message');
        });
    });

    // TODO: add tests for the change password screen
});
