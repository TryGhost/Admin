import hbs from 'htmlbars-inline-precompile';
import {find, render, settled} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

// NOTE: If the browser window is not focused/visible CodeMirror (or Chrome?) will
// take longer to respond to/fire events so it's possible that some of these tests
// will take 1-3 seconds

module('Integration: Component: gh-cm-editor', function (hooks) {
    setupRenderingTest(hooks);

    test('handles change event', async function (assert) {
        this.set('text', '');

        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text))}}`);
        // access CodeMirror directly as it doesn't pick up changes to the textarea
        let cm = find('.gh-input .CodeMirror').CodeMirror;
        cm.setValue('Testing');

        await settled();

        assert.strictEqual(this.text, 'Testing', 'text value after CM editor change');
    });

    test('can autofocus', async function (assert) {
        // CodeMirror's events are triggered outside of anything we can watch for
        // in the tests so let's run the class check when we know the event has
        // been fired and timeout if it's not fired as we expect
        let onFocus = async () => {
            // wait for runloop to finish so that the new class has been rendered
            await settled();
            assert.true(find('.gh-input').classList.contains('focus'), 'has focused class on first render with autofocus');
        };

        this.set('onFocus', onFocus);
        this.set('text', '');

        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text)) autofocus=true focus-in=(action onFocus)}}`);
    });
});
