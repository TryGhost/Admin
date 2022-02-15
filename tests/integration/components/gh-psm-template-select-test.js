import hbs from 'htmlbars-inline-precompile';
import mockThemes from '../../../mirage/config/themes';
import {find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';
import {startMirage} from 'ghost-admin/initializers/ember-cli-mirage';

module('Integration: Component: gh-psm-template-select', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = startMirage();

        server.create('theme', {
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

        mockThemes(server);
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('disables template selector if slug matches post template', async function (assert) {
        this.set('post', {
            slug: 'one',
            constructor: {
                modelName: 'post'
            }
        });

        await render(hbs`{{gh-psm-template-select post=post}}`);

        assert.true(find('select').disabled, 'select is disabled');
        assert.dom('p').hasText('post-one.hbs');
    });

    test('disables template selector if slug matches page template', async function (assert) {
        this.set('post', {
            slug: 'about',
            constructor: {
                modelName: 'page'
            }
        });

        await render(hbs`{{gh-psm-template-select post=post}}`);

        assert.true(find('select').disabled, 'select is disabled');
        assert.dom('p').hasText('page-about.hbs');
    });
});
