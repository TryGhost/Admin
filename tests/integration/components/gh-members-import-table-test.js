import hbs from 'htmlbars-inline-precompile';
import {click, findAll, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-members-import-table', function (hooks) {
    setupRenderingTest(hooks);

    test('renders members data with all the properties', async function (assert) {
        this.set('importData', [{
            name: 'Kevin',
            email: 'kevin@example.com'
        }]);
        this.set('setMapping', () => {});

        await render(hbs`
            <GhMembersImportTable @data={{this.importData}} @setMapping={{this.setMapping}}/>
        `);

        assert.strictEqual(findAll('table tbody tr').length, 2);
        assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
        assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Kevin');
        assert.match(findAll('table tbody tr td')[2].textContent, /Not imported/);
        assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'email');
        assert.strictEqual(findAll('table tbody tr td')[4].textContent, 'kevin@example.com');
        assert.match(findAll('table tbody tr td')[5].textContent, /Not imported/);
    });

    test('navigates through data when next and previous are clicked', async function (assert) {
        this.set('importData', [{
            name: 'Kevin',
            email: 'kevin@example.com'
        }, {
            name: 'Rish',
            email: 'rish@example.com'
        }]);
        this.set('setMapping', () => {});

        await render(hbs`
            <GhMembersImportTable @data={{this.importData}} @setMapping={{this.setMapping}}/>
        `);

        assert.strictEqual(findAll('table tbody tr').length, 2);
        assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
        assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Kevin');
        assert.match(findAll('table tbody tr td')[2].textContent, /Not imported/);
        assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'email');
        assert.strictEqual(findAll('table tbody tr td')[4].textContent, 'kevin@example.com');
        assert.match(findAll('table tbody tr td')[5].textContent, /Not imported/);

        await click('[data-test-import-next]');

        assert.strictEqual(findAll('table tbody tr').length, 2);
        assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
        assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Rish');
        assert.match(findAll('table tbody tr td')[2].textContent, /Not imported/);
        assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'email');
        assert.strictEqual(findAll('table tbody tr td')[4].textContent, 'rish@example.com');
        assert.match(findAll('table tbody tr td')[5].textContent, /Not imported/);

        await click('[data-test-import-prev]');

        assert.strictEqual(findAll('table tbody tr').length, 2);
        assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
        assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Kevin');
        assert.match(findAll('table tbody tr td')[2].textContent, /Not imported/);
        assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'email');
        assert.strictEqual(findAll('table tbody tr td')[4].textContent, 'kevin@example.com');
        assert.match(findAll('table tbody tr td')[5].textContent, /Not imported/);
    });

    test('cannot navigate through data when only one data item is present', async function (assert) {
        test('renders members data with all the properties', async function () {
            this.set('importData', [{
                name: 'Egg',
                email: 'egg@example.com'
            }]);

            await render(hbs`
                <GhMembersImportTable @importData={{this.importData}} />
            `);

            await click('[data-test-import-prev]');

            assert.strictEqual(findAll('table tbody tr').length, 2);
            assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
            assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Egg');
            assert.strictEqual(findAll('table tbody tr td')[2].textContent, 'email');
            assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'egg@example.com');

            await click('[data-test-import-next]');

            assert.strictEqual(findAll('table tbody tr').length, 2);
            assert.strictEqual(findAll('table tbody tr td')[0].textContent, 'name');
            assert.strictEqual(findAll('table tbody tr td')[1].textContent, 'Egg');
            assert.strictEqual(findAll('table tbody tr td')[2].textContent, 'email');
            assert.strictEqual(findAll('table tbody tr td')[3].textContent, 'egg@example.com');
        });
    });
});
