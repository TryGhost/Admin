import hbs from 'htmlbars-inline-precompile';
import {click, find, findAll, render} from '@ember/test-helpers';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-theme-table', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        this.set('themes', [
            {name: 'Daring', package: {name: 'Daring', version: '0.1.4'}, active: true},
            {name: 'casper', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'oscar-ghost-1.1.0', package: {name: 'Lanyon', version: '1.1.0'}},
            {name: 'foo'}
        ]);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        assert.strictEqual(findAll('[data-test-themes-list]').length, 1, 'themes list is present');
        assert.strictEqual(findAll('[data-test-theme-id]').length, 4, 'number of rows');

        let packageNames = findAll('[data-test-theme-title]').map(name => name.textContent.trim());

        assert.match(packageNames[0], /Casper \(default\)/);
        assert.match(packageNames[1], /Daring\s+Active/);
        assert.match(packageNames[2], /foo/);
        assert.match(packageNames[3], /Lanyon/);

        expect(
            find('[data-test-theme-active="true"]').querySelector('[data-test-theme-title]'),
            'active theme is highlighted'
        ).to.contain.text('Daring');

        assert.strictEqual(findAll('[data-test-button="activate"]').length, 3, 'non-active themes have an activate link');

        assert.notOk(find('[data-test-theme-active="true"]').querySelector('[data-test-button="activate"]'), 'active theme doesn\'t have an activate link');
    });

    test('has download button in actions dropdown for all themes', async function (assert) {
        const themes = [
            {name: 'Daring', package: {name: 'Daring', version: '0.1.4'}, active: true},
            {name: 'casper', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'oscar-ghost-1.1.0', package: {name: 'Lanyon', version: '1.1.0'}},
            {name: 'foo'}
        ];
        this.set('themes', themes);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        for (const theme of themes) {
            await click(`[data-test-theme-id="${theme.name}"] [data-test-button="actions"]`);
            assert.dom(`[data-test-actions-for="${theme.name}"] [data-test-button="download"]`).exists();
        }
    });

    test('has delete button for non-active, non-default, themes', async function (assert) {
        const themes = [
            {name: 'Daring', package: {name: 'Daring', version: '0.1.4'}},
            {name: 'oscar-ghost-1.1.0', package: {name: 'Lanyon', version: '1.1.0'}},
            {name: 'foo'}
        ];
        this.set('themes', themes);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        for (const theme of themes) {
            await click(`[data-test-theme-id="${theme.name}"] [data-test-button="actions"]`);
            assert.dom(`[data-test-actions-for="${theme.name}"] [data-test-button="delete"]`).exists();
        }
    });

    test('does not show delete action for casper', async function (assert) {
        const themes = [
            {name: 'Daring', package: {name: 'Daring', version: '0.1.4'}, active: true},
            {name: 'casper', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'oscar-ghost-1.1.0', package: {name: 'Lanyon', version: '1.1.0'}},
            {name: 'foo'}
        ];
        this.set('themes', themes);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        await click(`[data-test-theme-id="casper"] [data-test-button="actions"]`);
        assert.dom('[data-test-actions-for="casper"]').exists();
        assert.dom(`[data-test-actions-for="casper"] [data-test-button="delete"]`).doesNotExist();
    });

    test('does not show delete action for active theme', async function (assert) {
        const themes = [
            {name: 'Daring', package: {name: 'Daring', version: '0.1.4'}, active: true},
            {name: 'casper', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'oscar-ghost-1.1.0', package: {name: 'Lanyon', version: '1.1.0'}},
            {name: 'foo'}
        ];
        this.set('themes', themes);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        await click(`[data-test-theme-id="Daring"] [data-test-button="actions"]`);
        assert.dom('[data-test-actions-for="Daring"]').exists();
        assert.dom(`[data-test-actions-for="Daring"] [data-test-button="delete"]`).doesNotExist();
    });

    test('displays folder names if there are duplicate package names', async function (assert) {
        this.set('themes', [
            {name: 'daring', package: {name: 'Daring', version: '0.1.4'}},
            {name: 'daring-0.1.5', package: {name: 'Daring', version: '0.1.4'}},
            {name: 'casper', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'another', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'mine', package: {name: 'Casper', version: '1.3.1'}},
            {name: 'foo'}
        ]);

        await render(hbs`<GhThemeTable @themes={{themes}} />`);

        let packageNames = findAll('[data-test-theme-title]').map(name => name.textContent.trim());

        assert.deepEqual(packageNames, [
            'Casper (another)',
            'Casper (default)',
            'Casper (mine)',
            'Daring (daring)',
            'Daring (daring-0.1.5)',
            'foo'
        ], 'themes are ordered by label, folder names shown for duplicates');
    });
});
