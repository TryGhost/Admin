import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {currentURL} from '@ember/test-helpers';
import {disableLabsFlag, enableLabsFlag} from '../helpers/labs-flag';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

module('Acceptance: Members activity', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    beforeEach(function () {
        enableLabsFlag(this.server, 'membersActivityFeed');
    });

    test('redirects when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/members-activity');
        assert.strictEqual(currentURL(), '/signin');
    });

    test('redirects non-admins', async function (assert) {
        await invalidateSession();

        const role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/members-activity');
        assert.strictEqual(currentURL(), '/site');
    });

    module('as admin', function (hooks) {
        hooks.beforeEach(async function () {
            const role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
        });

        test('renders', async function (assert) {
            await visit('/members-activity');
            assert.strictEqual(currentURL(), '/members-activity');
        });

        test('requires feature flag', async function (assert) {
            disableLabsFlag(this.server, 'membersActivityFeed');
            await visit('/members-activity');
            assert.strictEqual(currentURL(), '/dashboard');
        });
    });
});
