import {authenticateSession} from 'ember-simple-auth/test-support';
import {currentURL, visit} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';

module('Acceptance: Launch flow', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('is not accessible when logged out', async function (assert) {
        await visit('/launch');
        assert.strictEqual(currentURL(), '/signin');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('can visit /launch', async function (assert) {
            await visit('/launch');
            assert.strictEqual(currentURL(), '/launch');
        });
    });
});
