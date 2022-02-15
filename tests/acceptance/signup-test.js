import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentRouteName, fillIn, find} from '@ember/test-helpers';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

module('Acceptance: Signup', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('can signup successfully', async function (assert) {
        let server = this.server;

        server.get('/authentication/invitation', function () {
            return {
                invitation: [{valid: true}]
            };
        });

        server.post('/authentication/invitation/', function ({users}, {requestBody}) {
            let params = JSON.parse(requestBody);
            assert.strictEqual(params.invitation[0].name, 'Test User');
            assert.strictEqual(params.invitation[0].email, 'kevin+test2@ghost.org');
            assert.strictEqual(params.invitation[0].password, 'thisissupersafe');
            assert.strictEqual(params.invitation[0].token, 'MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

            // ensure that `/users/me/` request returns a user
            let role = server.create('role', {name: 'Author'});
            users.create({email: 'kevin@test2@ghost.org', roles: [role]});

            return {
                invitation: [{
                    message: 'Invitation accepted.'
                }]
            };
        });

        // token details:
        // "1470346017929|kevin+test2@ghost.org|2cDnQc3g7fQTj9nNK4iGPSGfvomkLdXf68FuWgS66Ug="
        await visit('/signup/MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

        assert.strictEqual(currentRouteName(), 'signup');

        // focus out in Name field triggers inline error
        await blur('[data-test-input="name"]');

        expect(
            find('[data-test-input="name"]').closest('.form-group'),
            'name field group has error class when empty'
        ).to.have.class('error');

        assert.includes(find('[data-test-input="name"]').closest('.form-group').querySelector('.response').textContent, 'Please enter a name', 'name inline-error text');

        // entering text in Name field clears error
        await fillIn('[data-test-input="name"]', 'Test User');
        await blur('[data-test-input="name"]');

        expect(
            find('[data-test-input="name"]').closest('.form-group'),
            'name field loses error class after text input'
        ).to.not.have.class('error');

        assert.notOk(find('[data-test-input="name"]').closest('.form-group').querySelector('.response').textContent.trim(), 'name field error is removed after text input');

        // focus out in Email field triggers inline error
        await click('[data-test-input="email"]');
        await blur('[data-test-input="email"]');

        expect(
            find('[data-test-input="email"]').closest('.form-group'),
            'email field group has error class when empty'
        ).to.have.class('error');

        assert.includes(find('[data-test-input="email"]').closest('.form-group').querySelector('.response').textContent, 'Please enter an email', 'email inline-error text');

        // entering text in email field clears error
        await fillIn('[data-test-input="email"]', 'kevin+test2@ghost.org');
        await blur('[data-test-input="email"]');

        expect(
            find('[data-test-input="email"]').closest('.form-group'),
            'email field loses error class after text input'
        ).to.not.have.class('error');

        assert.notOk(find('[data-test-input="email"]').closest('.form-group').querySelector('.response').textContent.trim(), 'email field error is removed after text input');

        // check password validation
        // focus out in password field triggers inline error
        // no password
        await click('[data-test-input="password"]');
        await blur();

        expect(
            find('[data-test-input="password"]').closest('.form-group'),
            'password field group has error class when empty'
        ).to.have.class('error');

        assert.includes(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent, 'must be at least 10 characters', 'password field error text');

        // password too short
        await fillIn('[data-test-input="password"]', 'short');
        await blur('[data-test-input="password"]');

        assert.includes(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent, 'must be at least 10 characters', 'password field error text');

        // password must not be a bad password
        await fillIn('[data-test-input="password"]', '1234567890');
        await blur('[data-test-input="password"]');

        assert.includes(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent, 'you cannot use an insecure password', 'password field error text');

        // password must not be a disallowed password
        await fillIn('[data-test-input="password"]', 'password99');
        await blur('[data-test-input="password"]');

        assert.includes(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent, 'you cannot use an insecure password', 'password field error text');

        // password must not have repeating characters
        await fillIn('[data-test-input="password"]', '2222222222');
        await blur('[data-test-input="password"]');

        assert.includes(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent, 'you cannot use an insecure password', 'password field error text');

        // entering valid text in Password field clears error
        await fillIn('[data-test-input="password"]', 'thisissupersafe');
        await blur('[data-test-input="password"]');

        expect(
            find('[data-test-input="password"]').closest('.form-group'),
            'password field loses error class after text input'
        ).to.not.have.class('error');

        assert.strictEqual(find('[data-test-input="password"]').closest('.form-group').querySelector('.response').textContent.trim(), '', 'password field error is removed after text input');

        // submitting sends correct details and redirects to content screen
        await click('.gh-btn-green');

        assert.strictEqual(currentRouteName(), 'site');
    });

    test('redirects if already logged in', async function (assert) {
        this.server.get('/authentication/invitation', function () {
            return {
                invitation: [{valid: true}]
            };
        });

        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        // token details:
        // "1470346017929|kevin+test2@ghost.org|2cDnQc3g7fQTj9nNK4iGPSGfvomkLdXf68FuWgS66Ug="
        await visit('/signup/MTQ3MDM0NjAxNzkyOXxrZXZpbit0ZXN0MkBnaG9zdC5vcmd8MmNEblFjM2c3ZlFUajluTks0aUdQU0dmdm9ta0xkWGY2OEZ1V2dTNjZVZz0');

        assert.strictEqual(currentRouteName(), 'site');
        assert.includes(find('.gh-alert-content').textContent, 'sign out to register');
    });

    test('redirects with alert on invalid token', async function (assert) {
        await invalidateSession();
        await visit('/signup/---invalid---');

        assert.strictEqual(currentRouteName(), 'signin');
        assert.includes(find('.gh-alert-content').textContent, 'Invalid token');
    });

    test('redirects with alert on non-existant or expired token', async function (assert) {
        this.server.get('/authentication/invitation', function () {
            return {
                invitation: [{valid: false}]
            };
        });

        await invalidateSession();
        await visit('/signup/expired');

        assert.strictEqual(currentRouteName(), 'signin');
        assert.includes(find('.gh-alert-content').textContent, 'not exist');
    });
});
