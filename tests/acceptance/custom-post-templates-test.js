import ctrlOrCmd from 'ghost-admin/utils/ctrl-or-cmd';
import {authenticateSession} from 'ember-simple-auth/test-support';
import {beforeEach, module, test} from 'qunit';
import {click, fillIn, find, triggerKeyEvent, visit} from '@ember/test-helpers';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';

// keyCodes
const KEY_S = 83;

module('Acceptance: Custom Post Templates', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    beforeEach(async function () {
        this.server.loadFixtures('settings');

        let role = this.server.create('role', {name: 'Administrator'});
        this.server.create('user', {roles: [role]});

        return await authenticateSession();
    });

    module('with custom templates', function (hooks) {
        hooks.beforeEach(function () {
            this.server.create('theme', {
                active: true,
                name: 'example-theme',
                package: {
                    name: 'Example Theme',
                    version: '0.1'
                },
                templates: [
                    {
                        filename: 'custom-news-bulletin.hbs',
                        name: 'News Bulletin',
                        for: ['post', 'page'],
                        slug: null
                    },
                    {
                        filename: 'custom-big-images.hbs',
                        name: 'Big Images',
                        for: ['post', 'page'],
                        slug: null
                    },
                    {
                        filename: 'post-one.hbs',
                        name: 'One',
                        for: ['post'],
                        slug: 'one'
                    },
                    {
                        filename: 'page-about.hbs',
                        name: 'About',
                        for: ['page'],
                        slug: 'about'
                    }
                ]
            });
        });

        test('can change selected template', async function (assert) {
            let post = this.server.create('post', {customTemplate: 'custom-news-bulletin.hbs'});

            await visit('/editor/post/1');
            await click('[data-test-psm-trigger]');

            // template form should be shown
            assert.dom('[data-test-custom-template-form]').exists();

            // custom template should be selected
            let select = find('[data-test-select="custom-template"]');
            assert.strictEqual(select.value, 'custom-news-bulletin.hbs', 'selected value');

            // templates list should contain default and custom templates in alphabetical order
            assert.strictEqual(select.options.length, 3);
            assert.strictEqual(select.options.item(0).value, '', 'default value');
            assert.strictEqual(select.options.item(0).text, 'Default', 'default text');
            assert.strictEqual(select.options.item(1).value, 'custom-big-images.hbs', 'first custom value');
            assert.strictEqual(select.options.item(1).text, 'Big Images', 'first custom text');
            assert.strictEqual(select.options.item(2).value, 'custom-news-bulletin.hbs', 'second custom value');
            assert.strictEqual(select.options.item(2).text, 'News Bulletin', 'second custom text');

            // select the default template
            await fillIn(select, '');

            // save then check server record
            await triggerKeyEvent('.gh-app', 'keydown', KEY_S, {
                metaKey: ctrlOrCmd === 'command',
                ctrlKey: ctrlOrCmd === 'ctrl'
            });

            assert.strictEqual(this.server.db.posts.find(post.id).customTemplate, '', 'saved custom template');
        });

        test('disables template selector if slug matches slug-based template');

        test('doesn\'t query themes endpoint unncessarily', async function (assert) {
            // eslint-disable-next-line
            let themeRequests = () => {
                return this.server.pretender.handledRequests.filter(function (request) {
                    return request.url.match(/\/themes\//);
                });
            };

            this.server.create('post', {customTemplate: 'custom-news-bulletin.hbs'});

            await visit('/editor/post/1');
            await click('[data-test-psm-trigger]');

            assert.strictEqual(themeRequests().length, 1, 'after first open');

            await click('[data-test-psm-trigger]'); // hide
            await click('[data-test-psm-trigger]'); // show

            assert.strictEqual(themeRequests().length, 1, 'after second open');
        });
    });

    module('without custom templates', function (hooks) {
        hooks.beforeEach(function () {
            this.server.create('theme', {
                active: true,
                name: 'example-theme',
                package: {
                    name: 'Example Theme',
                    version: '0.1'
                },
                templates: []
            });
        });

        test('doesn\'t show template selector', async function (assert) {
            this.server.create('post', {customTemplate: 'custom-news-bulletin.hbs'});

            await visit('/editor/post/1');
            await click('[data-test-psm-trigger]');

            // template form should be shown
            assert.dom('[data-test-custom-template-form]').doesNotExist();
        });
    });
});
