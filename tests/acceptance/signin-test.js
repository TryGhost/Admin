import {Response} from 'ember-cli-mirage';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

module('Acceptance: Signin', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects if already authenticated', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/signin');

        assert.strictEqual(currentURL(), '/site', 'current url');
    });

    module('when attempting to signin', function (hooks) {
        hooks.beforeEach(function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role], slug: 'test-user'});

            this.server.post('/session', function (schema, {requestBody}) {
                let {
                    username,
                    password
                } = JSON.parse(requestBody);

                expect(username).to.equal('test@example.com');

                if (password === 'thisissupersafe') {
                    return new Response(201);
                } else {
                    return new Response(401, {}, {
                        errors: [{
                            type: 'UnauthorizedError',
                            message: 'Invalid Password'
                        }]
                    });
                }
            });
        });

        test('errors correctly', async function (assert) {
            await invalidateSession();
            await visit('/signin');

            assert.strictEqual(currentURL(), '/signin', 'signin url');

            assert.strictEqual(findAll('input[name="identification"]').length, 1, 'email input field');
            assert.strictEqual(findAll('input[name="password"]').length, 1, 'password input field');

            await click('.js-login-button');

            assert.strictEqual(findAll('.form-group.error').length, 2, 'number of invalid fields');

            assert.strictEqual(findAll('.main-error').length, 1, 'main error is displayed');

            await fillIn('[name="identification"]', 'test@example.com');
            await fillIn('[name="password"]', 'invalid');
            await click('.js-login-button');

            assert.strictEqual(currentURL(), '/signin', 'current url');

            assert.strictEqual(findAll('.main-error').length, 1, 'main error is displayed');

            assert.strictEqual(find('.main-error').textContent.trim(), 'Invalid Password', 'main error text');
        });

        test('submits successfully', async function (assert) {
            invalidateSession();

            await visit('/signin');
            assert.strictEqual(currentURL(), '/signin', 'current url');

            await fillIn('[name="identification"]', 'test@example.com');
            await fillIn('[name="password"]', 'thisissupersafe');
            await click('.js-login-button');
            assert.strictEqual(currentURL(), '/dashboard', 'currentURL');
        });
    });
});
