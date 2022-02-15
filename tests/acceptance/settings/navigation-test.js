import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession} from 'ember-simple-auth/test-support';
import {blur, click, currentRouteName, currentURL, fillIn, find, findAll, triggerEvent, typeIn} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

// simulate jQuery's `:visible` pseudo-selector
function withText(elements) {
    return Array.from(elements).filter(elem => elem.textContent.trim() !== '');
}

module('Acceptance: Settings - Navigation', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            await authenticateSession();
        });

        test('can visit /settings/navigation', async function (assert) {
            await visit('/settings/navigation');

            assert.strictEqual(currentRouteName(), 'settings.navigation');
            assert.strictEqual(find('[data-test-save-button]').textContent.trim(), 'Save', 'save button text');

            // fixtures contain two nav items, check for four rows as we
            // should have one extra that's blank for each navigation section
            assert.strictEqual(findAll('[data-test-navitem]').length, 4, 'navigation items count');
        });

        test('saves navigation settings', async function (assert) {
            await visit('/settings/navigation');
            await fillIn('#settings-navigation [data-test-navitem="0"] [data-test-input="label"]', 'Test');
            await typeIn('#settings-navigation [data-test-navitem="0"] [data-test-input="url"]', '/test');
            await click('[data-test-save-button]');

            let [navSetting] = this.server.db.settings.where({key: 'navigation'});

            assert.strictEqual(navSetting.value, '[{"label":"Test","url":"/test/"},{"label":"About","url":"/about"}]');

            // don't test against .error directly as it will pick up failed
            // tests "pre.error" elements
            assert.strictEqual(findAll('span.error').length, 0, 'error messages count');
            assert.strictEqual(findAll('.gh-alert').length, 0, 'alerts count');
            assert.strictEqual(withText(findAll('[data-test-error]')).length, 0, 'validation errors count');
        });

        test('validates new item correctly on save', async function (assert) {
            await visit('/settings/navigation');
            await click('[data-test-save-button]');

            assert.strictEqual(findAll('#settings-navigation [data-test-navitem]').length, 3, 'number of nav items after saving with blank new item');

            await fillIn('#settings-navigation [data-test-navitem="new"] [data-test-input="label"]', 'Test');
            await fillIn('#settings-navigation [data-test-navitem="new"] [data-test-input="url"]', '');
            await typeIn('#settings-navigation [data-test-navitem="new"] [data-test-input="url"]', 'http://invalid domain/');

            await click('[data-test-save-button]');

            assert.strictEqual(findAll('#settings-navigation [data-test-navitem]').length, 3, 'number of nav items after saving with invalid new item');

            assert.strictEqual(withText(findAll('#settings-navigation [data-test-navitem="new"] [data-test-error]')).length, 1, 'number of invalid fields in new item');
        });

        test('clears unsaved settings when navigating away but warns with a confirmation dialog', async function (assert) {
            await visit('/settings/navigation');
            await fillIn('[data-test-navitem="0"] [data-test-input="label"]', 'Test');
            await blur('[data-test-navitem="0"] [data-test-input="label"]');

            assert.strictEqual(find('[data-test-navitem="0"] [data-test-input="label"]').value, 'Test');

            await visit('/settings/code-injection');

            assert.strictEqual(findAll('.fullscreen-modal').length, 1, 'modal exists');

            // Leave without saving
            await click('.fullscreen-modal [data-test-leave-button]'), 'leave without saving';

            assert.strictEqual(currentURL(), '/settings/code-injection', 'currentURL');

            await visit('/settings/navigation');

            assert.strictEqual(find('[data-test-navitem="0"] [data-test-input="label"]').value, 'Home');
        });

        test('can add and remove items', async function (assert) {
            await visit('/settings/navigation');
            await click('#settings-navigation .gh-blognav-add');

            assert.ok(find('[data-test-navitem="new"] [data-test-error="label"]').textContent.trim(), 'blank label has validation error');

            await fillIn('[data-test-navitem="new"] [data-test-input="label"]', '');
            await typeIn('[data-test-navitem="new"] [data-test-input="label"]', 'New');

            assert.notOk(find('[data-test-navitem="new"] [data-test-error="label"]').textContent.trim(), 'label validation is visible after typing');

            await fillIn('[data-test-navitem="new"] [data-test-input="url"]', '');
            await typeIn('[data-test-navitem="new"] [data-test-input="url"]', '/new');
            await blur('[data-test-navitem="new"] [data-test-input="url"]');

            assert.notOk(find('[data-test-navitem="new"] [data-test-error="url"]').textContent.trim(), 'url validation is visible after typing');

            assert.strictEqual(find('[data-test-navitem="new"] [data-test-input="url"]').value, `${window.location.origin}/new/`);

            await click('.gh-blognav-add');

            assert.strictEqual(findAll('#settings-navigation [data-test-navitem]').length, 4, 'number of nav items after successful add');

            assert.notOk(find('#settings-navigation [data-test-navitem="new"] [data-test-input="label"]').value, 'new item label value after successful add');

            assert.strictEqual(find('#settings-navigation [data-test-navitem="new"] [data-test-input="url"]').value, `${window.location.origin}/`, 'new item url value after successful add');

            assert.strictEqual(withText(findAll('[data-test-navitem] [data-test-error]')).length, 0, 'number or validation errors shown after successful add');

            await click('#settings-navigation [data-test-navitem="0"] .gh-blognav-delete');

            assert.strictEqual(findAll('#settings-navigation [data-test-navitem]').length, 3, 'number of nav items after successful remove');

            // CMD-S shortcut works
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            let [navSetting] = this.server.db.settings.where({key: 'navigation'});

            assert.strictEqual(navSetting.value, '[{"label":"About","url":"/about"},{"label":"New","url":"/new/"}]');
        });

        test('can also add and remove items from seconday nav', async function (assert) {
            await visit('/settings/navigation');
            await click('#secondary-navigation .gh-blognav-add');

            assert.ok(find('#secondary-navigation [data-test-navitem="new"] [data-test-error="label"]').textContent.trim(), 'blank label has validation error');

            await fillIn('#secondary-navigation [data-test-navitem="new"] [data-test-input="label"]', '');
            await typeIn('#secondary-navigation [data-test-navitem="new"] [data-test-input="label"]', 'Foo');

            assert.notOk(find('#secondary-navigation [data-test-navitem="new"] [data-test-error="label"]').textContent.trim(), 'label validation is visible after typing');

            await fillIn('#secondary-navigation [data-test-navitem="new"] [data-test-input="url"]', '');
            await typeIn('#secondary-navigation [data-test-navitem="new"] [data-test-input="url"]', '/bar');
            await blur('#secondary-navigation [data-test-navitem="new"] [data-test-input="url"]');

            assert.notOk(find('#secondary-navigation [data-test-navitem="new"] [data-test-error="url"]').textContent.trim(), 'url validation is visible after typing');

            assert.strictEqual(find('#secondary-navigation [data-test-navitem="new"] [data-test-input="url"]').value, `${window.location.origin}/bar/`);

            await click('[data-test-save-button]');

            assert.strictEqual(findAll('#secondary-navigation [data-test-navitem]').length, 2, 'number of nav items after successful add');

            assert.notOk(find('#secondary-navigation [data-test-navitem="new"] [data-test-input="label"]').value, 'new item label value after successful add');

            assert.strictEqual(find('#secondary-navigation [data-test-navitem="new"] [data-test-input="url"]').value, `${window.location.origin}/`, 'new item url value after successful add');

            assert.strictEqual(withText(findAll('#secondary-navigation [data-test-navitem] [data-test-error]')).length, 0, 'number or validation errors shown after successful add');

            let [navSetting] = this.server.db.settings.where({key: 'secondary_navigation'});

            assert.strictEqual(navSetting.value, '[{"label":"Foo","url":"/bar/"}]');

            await click('#secondary-navigation [data-test-navitem="0"] .gh-blognav-delete');

            assert.strictEqual(findAll('#secondary-navigation [data-test-navitem]').length, 1, 'number of nav items after successful remove');

            // CMD-S shortcut works
            await triggerEvent('.gh-app', 'keydown', {
                keyCode: 83, // s
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            [navSetting] = this.server.db.settings.where({key: 'secondary_navigation'});

            assert.strictEqual(navSetting.value, '[]');
        });
    });
});
