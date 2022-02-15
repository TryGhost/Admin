import {authenticateSession,invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, findAll} from '@ember/test-helpers';
import {fileUpload} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';

module('Acceptance: Settings - Design', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    hooks.beforeEach(async function () {
        let role = this.server.create('role', {name: 'Administrator'});
        this.server.create('user', {roles: [role]});

        this.server.loadFixtures('themes');

        return await authenticateSession();
    });

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/general');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('renders with no custom theme settings', async function (assert) {
        await visit('/settings');
        await click('[data-test-nav="design"]');

        assert.strictEqual(currentURL(), '/settings/design', 'currentURL');
        assert.strictEqual(document.title, 'Settings - Design - Test Blog', 'page title');

        // side nav menu changes
        assert.dom('[data-test-nav-menu="design"]').exists('design menu');
        assert.dom('[data-test-nav-menu="main"]').doesNotExist('main menu');

        // side nav defaults to general group open
        assert.dom('[data-test-nav-toggle="general"]').exists('general toggle');
        assert.dom('[data-test-nav-group="general"]').exists('general form');

        // no other side nav groups exist
        assert.dom('[data-test-nav-toggle]').exists({count: 1}, 'no of group toggles');
        assert.dom('[data-test-nav-group]').exists({count: 1}, 'no of groups open');

        // current theme is shown in nav menu
        assert.dom('[data-test-text="current-theme"]').containsText('casper - v1.0');

        // defaults to "home" desktop preview
        assert.dom('[data-test-button="desktop-preview"]').hasClass('gh-btn-group-selected');
        assert.dom('[data-test-button="mobile-preview"]').doesNotHaveClass('gh-btn-group-selected');
    });

    test.skip('renders with custom theme settings');

    test('can install an official theme', async function (assert) {
        await visit('/settings/design');
        await click('[data-test-nav="change-theme"]');
        assert.strictEqual(currentURL(), '/settings/design/change-theme', 'currentURL');

        await click('[data-test-theme-link="Journal"]');
        assert.strictEqual(currentURL(), '/settings/design/change-theme/Journal', 'currentURL');

        await click('[data-test-button="install-theme"]');
        assert.dom('[data-test-modal="install-theme"]').exists('install-theme modal');
        assert.dom('[data-test-state="confirm"]').exists('confirm state');
        assert.strictEqual(findAll('[data-test-state]').length, 1, 'state count');

        await click('[data-test-button="confirm-install"]');
        assert.dom('[data-test-state="installed-no-notes"]').exists('success state');
        assert.strictEqual(findAll('[data-test-state]').length, 1, 'state count');

        // navigates back to design screen in background
        assert.strictEqual(currentURL(), '/settings/design', 'currentURL');

        await click('[data-test-button="cancel"]');
        assert.dom('[data-test-modal="install-theme"]').doesNotExist();

        // nav menu shows current theme
        assert.dom('[data-test-text="current-theme"]').containsText('Journal - v0.1');
    });

    test('can upload custom theme', async function (assert) {
        this.server.post('/themes/upload/', function ({themes}) {
            const theme = themes.create({
                name: 'custom',
                package: {
                    name: 'Custom',
                    version: '1.0'
                }
            });

            return {themes: [theme]};
        });

        await visit('/settings/design/change-theme');
        await click('[data-test-button="upload-theme"]');

        assert.dom('[data-test-modal="upload-theme"]').exists('upload-theme modal');

        await fileUpload('[data-test-modal="upload-theme"] input[type="file"]', ['test'], {name: 'valid-theme.zip', type: 'application/zip'});

        assert.dom('[data-test-state="installed-no-notes"]').exists('success state');
        assert.strictEqual(currentURL(), '/settings/design/change-theme', 'url after upload');

        await click('[data-test-button="activate"]');

        assert.strictEqual(currentURL(), '/settings/design', 'url after activate');
        assert.dom('[data-test-modal="install-theme"]').doesNotExist();
        assert.dom('[data-test-text="current-theme"]').containsText('custom - v1.0');
    });

    test.skip('can change between installed themes');
    test.skip('can delete installed theme');

    module('limits', function () {
        test('displays upgrade notice when custom themes are not allowed', async function (assert) {
            this.server.loadFixtures('configs');
            const config = this.server.db.configs.find(1);
            config.hostSettings = {
                limits: {
                    customThemes: {
                        allowlist: ['casper', 'dawn', 'lyra'],
                        error: 'All our official built-in themes are available the Starter plan, if you upgrade to one of our higher tiers you will also be able to edit and upload custom themes for your site.'
                    }
                }
            };
            this.server.db.configs.update(1, config);

            await visit('/settings/design/change-theme');
            await click('[data-test-button="upload-theme"]');

            assert.dom('[data-test-modal="limits/custom-theme"]').exists('limits/custom-theme modal');
        });
    });
});
