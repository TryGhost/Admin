import {Response} from 'ember-cli-mirage';
import {authenticateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, find, findAll} from '@ember/test-helpers';
import {fileUpload} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Members import', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    hooks.beforeEach(async function () {
        this.server.loadFixtures('configs');

        let role = this.server.create('role', {name: 'Owner'});
        this.server.create('user', {roles: [role]});

        return await authenticateSession();
    });

    test('can open and close import modal', async function (assert) {
        await visit('/members');
        await click('[data-test-button="members-actions"]');
        await click('[data-test-link="import-csv"]');

        assert.dom('[data-test-modal="import-members"]').exists('members import modal');
        assert.strictEqual(currentURL(), '/members/import');

        await click('[data-test-button="close-import-members"]');

        assert.dom('[data-test-modal="import-members"]').doesNotExist('members import modal');
        assert.strictEqual(currentURL(), '/members');
    });

    test('has working happy path for small import with no mapper changes and Stripe not connected', async function (assert) {
        await visit('/members/import');

        const csv = `email,name,note,subscribed_to_emails,labels,created_at
testemail@example.com,Test Email,This is a test template for importing your members list to Ghost,true,"vip,promotion",2019-10-30T14:52:08.000Z
`;

        await fileUpload(
            '[data-test-fileinput="members-csv"]',
            [csv],
            {name: 'members.csv', type: 'text/csv'}
        );

        assert.dom('[data-test-csv-file-mapping]').exists('csv file mapper');
        assert.dom('[data-test-members-import-table]').exists('csv file mapper');
        assert.strictEqual(findAll('[data-test-members-import-mapper]').length, 6, '# of mapper rows');
        assert.dom('[data-test-button="perform-import"]').containsText(' 1 ');

        await click('[data-test-button="perform-import"]');

        assert.dom('[data-test-modal="import-members"]').containsText('Import complete');

        await click('[data-test-button="close-import-members"]');

        assert.dom('[data-test-modal="import-members"]').doesNotExist();
    });

    test('can assign labels in import mapper', async function (assert) {
        const label1 = this.server.create('label');

        await visit('/members/import');

        const csv = `email,name,note,subscribed_to_emails,labels,created_at
testemail@example.com,Test Email,This is a test template for importing your members list to Ghost,true,"vip,promotion",2019-10-30T14:52:08.000Z
`;

        await fileUpload(
            '[data-test-fileinput="members-csv"]',
            [csv],
            {name: 'members.csv', type: 'text/csv'}
        );

        const labelInput = '[data-test-csv-file-mapping] .gh-member-label-input';
        assert.dom(labelInput).exists('label input');

        const dropdownContentId = find(`${labelInput} .ember-basic-dropdown-trigger`).getAttribute('aria-owns');
        await click(`${labelInput} .ember-basic-dropdown-trigger`);

        assert.strictEqual(findAll(`#${dropdownContentId} li.ember-power-select-option`).length, 1, '# of label options');

        // label input doesn't allow editing from the import modal
        assert.strictEqual(findAll(`#${dropdownContentId} [data-test-edit-label]`).length, 0, '# of label edit buttons');

        await click(find(`#${dropdownContentId} li.ember-power-select-option`));

        assert.strictEqual(findAll(`${labelInput} .ember-power-select-multiple-options li`).length, 1, '# of selected labels');
        assert.dom(`${labelInput} .ember-power-select-multiple-options li`).hasText(label1.name);

        let apiLabels = null;

        this.server.post('/members/upload/', function ({labels}, request) {
            const label = labels.create();

            apiLabels = request.requestBody.get('labels');

            return new Response(201, {}, {
                meta: {
                    import_label: label,
                    stats: {imported: 1, invalid: []}
                }
            });
        });

        await click('[data-test-button="perform-import"]');

        assert.strictEqual(apiLabels, label1.name);
    });
});
