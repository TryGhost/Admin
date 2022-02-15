import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {blur, fillIn, find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-psm-visibility-input', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        this.set('post', {
            visibility: 'members'
        });

        await render(hbs`{{gh-psm-visibility-input post=post}}`);

        assert.ok(this.element, 'top-level elements');
        assert.dom('option').exists({count: 3}, 'number of options');
        assert.strictEqual(find('select').value, 'members', 'selected option value');
    });

    test('updates post visibility on change', async function (assert) {
        let setVisibility = sinon.spy();

        this.set('post', {
            visibility: 'public',
            set: setVisibility
        });

        await render(hbs`{{gh-psm-visibility-input post=post}}`);

        assert.ok(this.element, 'top-level elements');
        assert.dom('option').exists({count: 3}, 'number of options');
        assert.strictEqual(find('select').value, 'public', 'selected option value');

        await fillIn('select', 'paid');
        await blur('select');

        assert.true(setVisibility.calledTwice);
        assert.true(setVisibility.calledWith('visibility', 'paid'));
        assert.true(setVisibility.calledWith('tiers', []));
    });
});
