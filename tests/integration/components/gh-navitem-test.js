import NavItem from 'ghost-admin/models/navigation-item';
import hbs from 'htmlbars-inline-precompile';
import {click, find, render, triggerEvent} from '@ember/test-helpers';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-navitem', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.set('baseUrl', 'http://localhost:2368');
    });

    test('renders', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url'}));

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl}}`);
        let item = find('.gh-blognav-item');

        assert.ok(item.querySelector('.gh-blognav-grab'));
        assert.ok(item.querySelector('.gh-blognav-label'));
        assert.ok(item.querySelector('.gh-blognav-url'));
        assert.ok(item.querySelector('.gh-blognav-delete'));

        // doesn't show any errors
        assert.dom('.gh-blognav-item--error').doesNotExist();
        assert.dom('.error').doesNotExist();
        expect(find('.response')).to.not.be.displayed;
    });

    test('doesn\'t show drag handle for new items', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url', isNew: true}));

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl}}`);
        let item = find('.gh-blognav-item');

        assert.notOk(item.querySelector('.gh-blognav-grab'));
    });

    test('shows add button for new items', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url', isNew: true}));

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl}}`);
        let item = find('.gh-blognav-item');

        assert.ok(item.querySelector('.gh-blognav-add'));
        assert.notOk(item.querySelector('.gh-blognav-delete'));
    });

    test('triggers delete action', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url'}));

        let deleteActionCallCount = 0;
        this.set('deleteItem', (navItem) => {
            assert.strictEqual(navItem, this.navItem);
            deleteActionCallCount += 1;
        });

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl deleteItem=(action deleteItem)}}`);
        await click('.gh-blognav-delete');

        assert.strictEqual(deleteActionCallCount, 1);
    });

    test('triggers add action', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url', isNew: true}));

        let addActionCallCount = 0;
        this.set('add', () => {
            addActionCallCount += 1;
        });

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl addItem=(action add)}}`);
        await click('.gh-blognav-add');

        assert.strictEqual(addActionCallCount, 1);
    });

    test('triggers update url action', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url'}));

        let updateActionCallCount = 0;
        this.set('update', (value) => {
            updateActionCallCount += 1;
            return value;
        });

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl updateUrl=(action update)}}`);
        await triggerEvent('.gh-blognav-url input', 'blur');

        assert.strictEqual(updateActionCallCount, 1);
    });

    test('triggers update label action', async function (assert) {
        this.set('navItem', NavItem.create({label: 'Test', url: '/url'}));

        let updateActionCallCount = 0;
        this.set('update', (value) => {
            updateActionCallCount += 1;
            return value;
        });

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl updateLabel=(action update)}}`);
        await triggerEvent('.gh-blognav-label input', 'blur');

        assert.strictEqual(updateActionCallCount, 2);
    });

    test('displays inline errors', async function (assert) {
        this.set('navItem', NavItem.create({label: '', url: ''}));
        this.navItem.validate();

        await render(hbs`{{gh-navitem navItem=navItem baseUrl=baseUrl}}`);
        let item = find('.gh-blognav-item');

        assert.dom(item).hasClass('gh-blognav-item--error');
        assert.dom('.gh-blognav-label').hasClass('error');
        assert.dom('.gh-blognav-label .response').hasText('You must specify a label');
        assert.dom('.gh-blognav-url').hasClass('error');
        assert.dom('.gh-blognav-url .response').hasText('You must specify a URL or relative path');
    });
});
