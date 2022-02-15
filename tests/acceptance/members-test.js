import moment from 'moment';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentURL, fillIn, find, findAll, settled} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {timeout} from 'ember-concurrency';
import {visit} from '../helpers/visit';

module('Acceptance: Members', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/members');

        assert.strictEqual(currentURL(), '/signin');
    });

    test('redirects non-admins to site', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role]});

        await authenticateSession();
        await visit('/members');

        assert.strictEqual(currentURL(), '/site');
        assert.dom('[data-test-nav="members"]').doesNotExist('sidebar link');
    });

    module('as owner', function (hooks) {
        hooks.beforeEach(async function () {
            this.server.loadFixtures('configs');

            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test('it renders, can be navigated, can edit member', async function (assert) {
            let member1 = this.server.create('member', {createdAt: moment.utc().subtract(1, 'day').valueOf()});
            this.server.create('member', {createdAt: moment.utc().subtract(2, 'day').valueOf()});

            await visit('/members');

            await settled();

            // lands on correct page
            assert.strictEqual(currentURL(), '/members', 'currentURL');

            // it has correct page title
            assert.strictEqual(document.title, 'Members - Test Blog', 'page title');

            // it lists all members
            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 2, 'members list count');

            let member = find('[data-test-list="members-list-item"]');
            assert.strictEqual(member.querySelector('.gh-members-list-name').textContent, member1.name, 'member list item title');

            await visit(`/members/${member1.id}`);

            // // second wait is needed for the member details to settle
            await settled();

            // it shows selected member form
            assert.strictEqual(find('[data-test-input="member-name"]').value, member1.name, 'loads correct member into form');

            assert.strictEqual(find('[data-test-input="member-email"]').value, member1.email, 'loads correct email into form');

            // trigger save
            await fillIn('[data-test-input="member-name"]', 'New Name');
            await blur('[data-test-input="member-name"]');

            await click('[data-test-button="save"]');

            // extra timeout needed for Travis - sometimes it doesn't update
            // quick enough and an extra wait() call doesn't help
            await timeout(100);

            await click('[data-test-link="members-back"]');

            // lands on correct page
            assert.strictEqual(currentURL(), '/members', 'currentURL');
        });

        test('can create a new member', async function (assert) {
            this.server.create('member', {createdAt: moment.utc().subtract(1, 'day').valueOf()});

            await visit('/members');

            await settled();

            // lands on correct page
            assert.strictEqual(currentURL(), '/members', 'currentURL');

            // it has correct page title
            assert.strictEqual(document.title, 'Members - Test Blog', 'page title');

            // it lists all members
            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 1, 'members list count');

            //  start new member
            await click('[data-test-new-member-button="true"]');

            // it navigates to the new member route
            assert.strictEqual(currentURL(), '/members/new', 'new member URL');
            // it displays the new member form
            assert.includes(find('.gh-canvas-header h2').textContent, 'New member', 'settings pane title');

            // all fields start blank
            findAll('.gh-member-settings-primary .gh-input').forEach(function (elem) {
                assert.notOk(elem.value, `input field for ${elem.getAttribute('name')}`);
            });

            // save new member
            await fillIn('[data-test-input="member-name"]', 'New Name');
            await blur('[data-test-input="member-name"]');

            await fillIn('[data-test-input="member-email"]', 'example@domain.com');
            await blur('[data-test-input="member-email"]');

            await click('[data-test-button="save"]');

            assert.strictEqual(find('[data-test-input="member-name"]').value, 'New Name', 'name has been preserved');

            assert.strictEqual(find('[data-test-input="member-email"]').value, 'example@domain.com', 'email has been preserved');
        });

        test('can bulk delete members', async function (assert) {
            // members to be kept
            this.server.createList('member', 6);

            // imported members to be deleted
            const label = this.server.create('label');
            this.server.createList('member', 5, {labels: [label]});

            await visit('/members');

            assert.strictEqual(findAll('[data-test-member]').length, 11);

            await click('[data-test-button="members-actions"]');

            assert.dom('[data-test-button="delete-selected"]').doesNotExist();

            // a filter is needed for the delete-selected button to show
            await click('[data-test-button="members-filter-actions"]');
            await click('.gh-member-label-input input');
            await click(`[data-test-label-filter="${label.name}"]`);
            await click(`[data-test-button="members-apply-filter"]`);

            assert.strictEqual(findAll('[data-test-member]').length, 5);
            assert.strictEqual(currentURL(), '/members?filter=label%3A%5Blabel-0%5D');

            await click('[data-test-button="members-actions"]');

            assert.dom('[data-test-button="delete-selected"]').exists();

            await click('[data-test-button="delete-selected"]');

            assert.dom('[data-test-modal="delete-members"]').exists();
            assert.dom('[data-test-text="delete-count"]').hasText('5 members');

            // ensure export endpoint gets hit with correct query params when deleting
            let exportQueryParams;
            this.server.get('/members/upload', (schema, request) => {
                exportQueryParams = request.queryParams;
            });

            await click('[data-test-button="confirm"]');

            assert.deepEqual(exportQueryParams, {filter: 'label:[label-0]', limit: 'all'});

            assert.dom('[data-test-text="deleted-count"]').hasText('5 members');
            assert.dom('[data-test-button="confirm"]').doesNotExist();

            // members filter is reset
            assert.strictEqual(currentURL(), '/members');
            assert.strictEqual(findAll('[data-test-member]').length, 6);

            await click('[data-test-button="close-modal"]');

            assert.dom('[data-test-modal="delete-members"]').doesNotExist();
        });
    });
});
