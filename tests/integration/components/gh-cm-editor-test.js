import hbs from 'htmlbars-inline-precompile';
import {click, find, render, settled, triggerEvent} from '@ember/test-helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupRenderingTest} from 'ember-mocha';

// NOTE: If the browser window is not focused/visible CodeMirror (or Chrome?) will
// take longer to respond to/fire events so it's possible that some of these tests
// will take 1-3 seconds

describe('Integration: Component: gh-cm-editor', function () {
    setupRenderingTest();

    it('handles change event', async function () {
        this.set('text', '');

        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text))}}`);
        // access CodeMirror directly as it doesn't pick up changes to the textarea
        let cm = find('.gh-input .CodeMirror').CodeMirror;
        cm.setValue('Testing');

        await settled();

        expect(this.get('text'), 'text value after CM editor change')
            .to.equal('Testing');
    });

    it('handles focus event', async function () {
        // CodeMirror's events are triggered outside of anything we can watch for
        // in the tests so let's run the class check when we know the event has
        // been fired and timeout if it's not fired as we expect
        let onFocus = async () => {
            // wait for runloop to finish so that the new class has been rendered
            await settled();
            expect(find('.gh-input'), 'has focused class on first render with autofocus')
                .to.have.class('focus');
        };

        this.set('onFocus', onFocus);
        this.set('text', '');

        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text)) focus-in=(action onFocus)}}`);

        // CodeMirror polls the input for changes every 100ms
        await click('textarea');
        await triggerEvent('textarea', 'focus');
    });

    it('handles blur event', async function () {
        this.set('text', '');
        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text))}}`);

        expect(find('.gh-input')).to.not.have.class('focus');

        await click('textarea');
        await triggerEvent('textarea', 'focus');

        expect(find('.gh-input')).to.have.class('focus');

        await triggerEvent('textarea', 'blur');

        expect(find('.gh-input')).to.not.have.class('focus');
    });

    it('can autofocus', async function () {
        // CodeMirror's events are triggered outside of anything we can watch for
        // in the tests so let's run the class check when we know the event has
        // been fired and timeout if it's not fired as we expect
        let onFocus = async () => {
            // wait for runloop to finish so that the new class has been rendered
            await settled();
            expect(find('.gh-input').classList.contains('focus'), 'has focused class on first render with autofocus')
                .to.be.true;
        };

        this.set('onFocus', onFocus);
        this.set('text', '');

        await render(hbs`{{gh-cm-editor text class="gh-input" update=(action (mut text)) autofocus=true focus-in=(action onFocus)}}`);
    });
});
