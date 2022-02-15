// TODO: remove usage of Ember Data's private `Errors` class when refactoring validations
// eslint-disable-next-line
import DS from 'ember-data';
import EmberObject from '@ember/object';
import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import {blur, click, fillIn, find, findAll, render} from '@ember/test-helpers';
import {module, skip} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

const {Errors} = DS;

let configStub = Service.extend({
    blogUrl: 'http://localhost:2368'
});

let mediaQueriesStub = Service.extend({
    maxWidth600: false
});

module('Integration: Component: gh-tag-settings-form', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        /* eslint-disable camelcase */
        let tag = EmberObject.create({
            id: 1,
            name: 'Test',
            slug: 'test',
            description: 'Description.',
            metaTitle: 'Meta Title',
            metaDescription: 'Meta description',
            errors: Errors.create(),
            hasValidated: []
        });
        /* eslint-enable camelcase */

        this.set('tag', tag);
        this.set('setProperty', function (property, value) {
            // this should be overridden if a call is expected
            // eslint-disable-next-line no-console
            console.error(`setProperty called '${property}: ${value}'`);
        });

        this.owner.register('service:config', configStub);
        this.owner.register('service:media-queries', mediaQueriesStub);
    });

    skip('has the correct title', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);
        assert.strictEqual(find('.tag-settings-pane h4').textContent, 'Tag settings', 'existing tag title');

        this.set('tag.isNew', true);
        assert.strictEqual(find('.tag-settings-pane h4').textContent, 'New tag', 'new tag title');
    });

    skip('renders main settings', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        assert.strictEqual(findAll('.gh-image-uploader').length, 1, 'displays image uploader');
        assert.strictEqual(find('input[name="name"]').value, 'Test', 'name field value');
        assert.strictEqual(find('input[name="slug"]').value, 'test', 'slug field value');
        assert.strictEqual(find('textarea[name="description"]').value, 'Description.', 'description field value');
        assert.strictEqual(find('input[name="metaTitle"]').value, 'Meta Title', 'metaTitle field value');
        assert.strictEqual(find('textarea[name="metaDescription"]').value, 'Meta description', 'metaDescription field value');
    });

    skip('can switch between main/meta settings', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        assert.strictEqual(find('.tag-settings-pane').classList.contains('settings-menu-pane-in'), true, 'main settings are displayed by default');
        assert.strictEqual(find('.tag-meta-settings-pane').classList.contains('settings-menu-pane-out-right'), true, 'meta settings are hidden by default');

        await click('.meta-data-button');

        assert.strictEqual(find('.tag-settings-pane').classList.contains('settings-menu-pane-out-left'), true, 'main settings are hidden after clicking Meta Data button');
        assert.strictEqual(find('.tag-meta-settings-pane').classList.contains('settings-menu-pane-in'), true, 'meta settings are displayed after clicking Meta Data button');

        await click('.back');

        assert.strictEqual(find('.tag-settings-pane').classList.contains('settings-menu-pane-in'), true, 'main settings are displayed after clicking "back"');
        assert.strictEqual(find('.tag-meta-settings-pane').classList.contains('settings-menu-pane-out-right'), true, 'meta settings are hidden after clicking "back"');
    });

    skip('has one-way binding for properties', async function (assert) {
        this.set('setProperty', function () {
            // noop
        });

        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        await fillIn('input[name="name"]', 'New name');
        await fillIn('input[name="slug"]', 'new-slug');
        await fillIn('textarea[name="description"]', 'New description');
        await fillIn('input[name="metaTitle"]', 'New metaTitle');
        await fillIn('textarea[name="metaDescription"]', 'New metaDescription');

        assert.strictEqual(this.get('tag.name'), 'Test', 'tag name');
        assert.strictEqual(this.get('tag.slug'), 'test', 'tag slug');
        assert.strictEqual(this.get('tag.description'), 'Description.', 'tag description');
        assert.strictEqual(this.get('tag.metaTitle'), 'Meta Title', 'tag metaTitle');
        assert.strictEqual(this.get('tag.metaDescription'), 'Meta description', 'tag metaDescription');
    });

    skip('triggers setProperty action on blur of all fields', async function (assert) {
        let lastSeenProperty = '';
        let lastSeenValue = '';

        this.set('setProperty', function (property, value) {
            lastSeenProperty = property;
            lastSeenValue = value;
        });

        let testSetProperty = async (selector, expectedProperty, expectedValue) => {
            await click(selector);
            await fillIn(selector, expectedValue);
            await blur(selector);
            assert.strictEqual(lastSeenProperty, expectedProperty, 'property');
            assert.strictEqual(lastSeenValue, expectedValue, 'value');
        };

        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        await testSetProperty('input[name="name"]', 'name', 'New name');
        await testSetProperty('input[name="slug"]', 'slug', 'new-slug');
        await testSetProperty('textarea[name="description"]', 'description', 'New description');
        await testSetProperty('input[name="metaTitle"]', 'metaTitle', 'New metaTitle');
        await testSetProperty('textarea[name="metaDescription"]', 'metaDescription', 'New metaDescription');
    });

    skip('displays error messages for validated fields', async function (assert) {
        let errors = this.get('tag.errors');
        let hasValidated = this.get('tag.hasValidated');

        errors.add('name', 'must be present');
        hasValidated.push('name');

        errors.add('slug', 'must be present');
        hasValidated.push('slug');

        errors.add('description', 'is too long');
        hasValidated.push('description');

        errors.add('metaTitle', 'is too long');
        hasValidated.push('metaTitle');

        errors.add('metaDescription', 'is too long');
        hasValidated.push('metaDescription');

        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        let nameFormGroup = find('input[name="name"]').closest('.form-group');
        assert.dom(nameFormGroup).hasClass('error', 'name form group has error state');
        assert.ok(nameFormGroup.querySelector('.response'), 'name form group has error message');

        let slugFormGroup = find('input[name="slug"]').closest('.form-group');
        assert.dom(slugFormGroup).hasClass('error', 'slug form group has error state');
        assert.ok(slugFormGroup.querySelector('.response'), 'slug form group has error message');

        let descriptionFormGroup = find('textarea[name="description"]').closest('.form-group');
        assert.dom(descriptionFormGroup).hasClass('error', 'description form group has error state');

        let metaTitleFormGroup = find('input[name="metaTitle"]').closest('.form-group');
        assert.dom(metaTitleFormGroup).hasClass('error', 'metaTitle form group has error state');
        assert.ok(metaTitleFormGroup.querySelector('.response'), 'metaTitle form group has error message');

        let metaDescriptionFormGroup = find('textarea[name="metaDescription"]').closest('.form-group');
        assert.dom(metaDescriptionFormGroup).hasClass('error', 'metaDescription form group has error state');
        assert.ok(metaDescriptionFormGroup.querySelector('.response'), 'metaDescription form group has error message');
    });

    skip('displays char count for text fields', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        let descriptionFormGroup = find('textarea[name="description"]').closest('.form-group');
        assert.dom('.word-count').hasText('12', 'description char count');

        let metaDescriptionFormGroup = find('textarea[name="metaDescription"]').closest('.form-group');
        assert.dom('.word-count').hasText('16', 'description char count');
    });

    skip('renders SEO title preview', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);
        assert.strictEqual(find('.seo-preview-title').textContent, 'Meta Title', 'displays meta title if present');

        this.set('tag.metaTitle', '');
        assert.strictEqual(find('.seo-preview-title').textContent, 'Test', 'falls back to tag name without metaTitle');

        this.set('tag.name', (new Array(151).join('x')));
        let expectedLength = 70 + '…'.length;
        assert.strictEqual(find('.seo-preview-title').textContent.length, expectedLength, 'cuts title to max 70 chars');
    });

    skip('renders SEO URL preview', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);
        assert.strictEqual(find('.seo-preview-link').textContent, 'http://localhost:2368/tag/test/', 'adds url and tag prefix');

        this.set('tag.slug', (new Array(151).join('x')));
        let expectedLength = 70 + '…'.length;
        assert.strictEqual(find('.seo-preview-link').textContent.length, expectedLength, 'cuts slug to max 70 chars');
    });

    skip('renders SEO description preview', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);
        assert.strictEqual(find('.seo-preview-description').textContent, 'Meta description', 'displays meta description if present');

        this.set('tag.metaDescription', '');
        assert.strictEqual(find('.seo-preview-description').textContent, 'Description.', 'falls back to tag description without metaDescription');

        this.set('tag.description', (new Array(500).join('x')));
        let expectedLength = 156 + '…'.length;
        assert.strictEqual(find('.seo-preview-description').textContent.length, expectedLength, 'cuts description to max 156 chars');
    });

    skip('resets if a new tag is received', async function (assert) {
        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);
        await click('.meta-data-button');
        assert.strictEqual(find('.tag-meta-settings-pane').classList.contains('settings-menu-pane-in'), true, 'meta data pane is shown');

        this.set('tag', EmberObject.create({id: '2'}));
        assert.strictEqual(find('.tag-settings-pane').classList.contains('settings-menu-pane-in'), true, 'resets to main settings');
    });

    skip('triggers delete tag modal on delete click', async function (assert) {
        let openModalFired = false;

        this.set('openModal', () => {
            openModalFired = true;
        });

        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty) showDeleteTagModal=(action openModal)}}
        `);
        await click('.settings-menu-delete-button');

        assert.strictEqual(openModalFired, true);
    });

    skip('shows tags arrow link on mobile', async function (assert) {
        let mediaQueries = this.owner.lookup('service:media-queries');
        mediaQueries.set('maxWidth600', true);

        await render(hbs`
            {{gh-tag-settings-form tag=tag setProperty=(action setProperty)}}
        `);

        assert.strictEqual(findAll('.tag-settings-pane .settings-menu-header .settings-menu-header-action').length, 1, 'tags link is shown');
    });
});
