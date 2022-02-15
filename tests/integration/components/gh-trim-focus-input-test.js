import hbs from 'htmlbars-inline-precompile';
import {blur, find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-trim-focus-input', function (hooks) {
    setupRenderingTest(hooks);

    test('trims value on focusOut', async function (assert) {
        this.set('text', 'some random stuff    ');
        await render(hbs`{{gh-trim-focus-input value=(readonly text) input=(action (mut text) value="target.value")}}`);

        await blur('input');

        assert.strictEqual(this.text, 'some random stuff');
    });

    test('trims value on focusOut before calling custom focus-out', async function (assert) {
        this.set('text', 'some random stuff    ');
        this.set('customFocusOut', function (value) {
            assert.strictEqual(find('.gh-input').value, 'some random stuff', 'input value');
            assert.strictEqual(value, 'some random stuff', 'value');
        });

        await render(hbs`{{gh-trim-focus-input
            value=(readonly text)
            input=(action (mut text) value="target.value")
            focus-out=(action customFocusOut)
        }}`);

        await blur('input');

        assert.strictEqual(this.text, 'some random stuff');
    });

    test('does not have the autofocus attribute if not set to focus', async function (assert) {
        this.set('text', 'some text');
        await render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=false}}`);
        assert.notOk(find('input').autofocus);
    });

    test('has the autofocus attribute if set to focus', async function (assert) {
        this.set('text', 'some text');
        await render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        assert.ok(find('input').autofocus);
    });

    test('handles undefined values', async function (assert) {
        this.set('text', undefined);
        await render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        assert.ok(find('input').autofocus);
    });

    test('handles non-string values', async function (assert) {
        this.set('text', 10);
        await render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        assert.strictEqual(find('input').value, '10');
    });
});
