import hbs from 'htmlbars-inline-precompile';
import {authenticateSession} from 'ember-simple-auth/test-support';
import {findAll, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: <Dashboard::LatestMemberActivity>', function (hooks) {
    setupRenderingTest(hooks);
    setupMirage(hooks);

    test('renders with no activities', async function (assert) {
        await render(hbs(`<Dashboard::LatestMemberActivity />`));

        assert.dom('[data-test-dashboard-member-activity]').exists();
        assert.dom('[data-test-no-member-activities]').exists();
    });

    test('renders 5 latest activities', async function (assert) {
        this.server.createList('member-activity-event', 10);

        await render(hbs(`<Dashboard::LatestMemberActivity />`));

        assert.dom('[data-test-dashboard-member-activity]').exists();
        assert.dom('[data-test-no-member-activities]').doesNotExist();

        assert.strictEqual(findAll('[data-test-dashboard-member-activity-item]').length, 5);
    });

    test('renders nothing when owner has not completed launch', async function (assert) {
        let role = this.server.create('role', {name: 'Owner'});
        this.server.create('user', {roles: [role]});
        await authenticateSession();
        const sessionService = this.owner.lookup('service:session');
        await sessionService.populateUser();

        this.server.create('setting', {
            key: 'editor_is_launch_complete',
            value: false,
            group: 'editor'
        });
        const settingsService = this.owner.lookup('service:settings');
        await settingsService.fetch();

        await render(hbs(`<Dashboard::LatestMemberActivity />`));

        assert.dom('[data-test-dashboard-member-activity]').doesNotExist();
    });
});
