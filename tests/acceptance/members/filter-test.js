import {authenticateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, fillIn, findAll} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Members filtering', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    hooks.beforeEach(async function () {
        this.server.loadFixtures('configs');

        let role = this.server.create('role', {name: 'Owner'});
        this.server.create('user', {roles: [role]});

        return await authenticateSession();
    });

    test('has a known base-state', async function (assert) {
        this.server.createList('member', 7);

        await visit('/members');

        // members are listed
        assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 7, '# of member rows');

        // export is available
        assert.dom('[data-test-button="export-members"]').exists('export members button');
        assert.dom('[data-test-button="export-members"]').doesNotHaveAttribute('disabled', 'export members button');

        // bulk actions are hidden
        assert.dom('[data-test-button="add-label-selected"]').doesNotExist('add label to selected button');
        assert.dom('[data-test-button="remove-label-selected"]').doesNotExist('remove label from selected button');
        assert.dom('[data-test-button="unsubscribe-selected"]').doesNotExist('unsubscribe selected button');
        assert.dom('[data-test-button="delete-selected"]').doesNotExist('delete selected button');

        // filter and search are inactive
        assert.dom('[data-test-input="members-search"]').exists('search input');
        assert.dom('[data-test-input="members-search"]').doesNotHaveClass('active', 'search input');
        assert.dom('[data-test-button="members-filter-actions"]').doesNotHaveClass('gh-btn-label-green', 'filter button');
    });

    module('search', function (hooks) {
        hooks.beforeEach(function () {
            // specific member names+emails so search is deterministic
            // (default factory has random names+emails)
            this.server.create('member', {name: 'X', email: 'x@x.xxx'});
            this.server.create('member', {name: 'Y', email: 'y@y.yyy'});
            this.server.create('member', {name: 'Z', email: 'z@z.zzz'});
        });

        test('works', async function (assert) {
            await visit('/members');

            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 3, '# of initial member rows');

            await fillIn('[data-test-input="members-search"]', 'X');

            // list updates
            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 1, '# of members matching "X"');

            // URL reflects search
            assert.strictEqual(currentURL(), '/members?search=X');

            // search input is active
            assert.dom('[data-test-input="members-search"]').hasClass('active');

            // bulk actions become available
            assert.dom('[data-test-button="add-label-selected"]').exists('add label to selected button');
            assert.dom('[data-test-button="remove-label-selected"]').exists('remove label from selected button');
            assert.dom('[data-test-button="unsubscribe-selected"]').exists('unsubscribe selected button');
            assert.dom('[data-test-button="delete-selected"]').exists('delete selected button');

            // clearing search returns us to starting state
            await fillIn('[data-test-input="members-search"]', '');

            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 3, '# of members after clearing search');

            assert.dom('[data-test-input="members-search"]').doesNotHaveClass('active');
        });

        test('populates from query param', async function (assert) {
            await visit('/members?search=Y');

            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 1, '# of initial member rows');

            assert.dom('[data-test-input="members-search"]').hasValue('Y');
            assert.dom('[data-test-input="members-search"]').hasClass('active');
        });

        test('has an empty state', async function (assert) {
            await visit('/members');
            await fillIn('[data-test-input="members-search"]', 'unknown');

            assert.strictEqual(currentURL(), '/members?search=unknown');

            // replaces members table with the no-matching members state
            assert.dom('[data-test-table="members"]').doesNotExist();
            assert.dom('[data-test-no-matching-members]').exists();

            // search input is still shown
            assert.dom('[data-test-input="members-search"]').isVisible();
            assert.dom('[data-test-input="members-search"]').hasClass('active');

            // export is disabled
            assert.dom('[data-test-button="export-members"]').hasAttribute('disabled');

            // bulk actions are hidden
            assert.dom('[data-test-button="add-label-selected"]').doesNotExist();
            assert.dom('[data-test-button="remove-label-selected"]').doesNotExist();
            assert.dom('[data-test-button="unsubscribe-selected"]').doesNotExist();
            assert.dom('[data-test-button="delete-selected"]').doesNotExist();

            // can clear the search
            await click('[data-test-no-matching-members] [data-test-button="show-all-members"]');

            assert.strictEqual(currentURL(), '/members');
            assert.dom('[data-test-input="members-search"]').hasValue('');
            assert.dom('[data-test-input="members-search"]').doesNotHaveClass('active');
            assert.strictEqual(findAll('[data-test-list="members-list-item"]').length, 3);
        });
    });
});
