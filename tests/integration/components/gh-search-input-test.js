import Pretender from 'pretender';
import hbs from 'htmlbars-inline-precompile';
import {fillIn, findAll, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-search-input', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('renders', async function (assert) {
        // renders the component on the page
        await render(hbs`{{gh-search-input}}`);

        assert.dom('.ember-power-select-search input').exists();
    });

    test('opens the dropdown on text entry', async function (assert) {
        await render(hbs`{{gh-search-input}}`);
        await fillIn('input[type="search"]', 'test');

        assert.strictEqual(findAll('.ember-basic-dropdown-content').length, 1);
    });
});
