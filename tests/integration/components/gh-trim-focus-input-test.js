import hbs from 'htmlbars-inline-precompile';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {find, triggerEvent} from '@ember/test-helpers';
import {run} from '@ember/runloop';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh-trim-focus-input', function () {
    setupComponentTest('gh-trim-focus-input', {
        integration: true
    });

    it('trims value on focusOut', function () {
        this.set('text', 'some random stuff    ');
        this.render(hbs`{{gh-trim-focus-input value=(readonly text) input=(action (mut text) value="target.value")}}`);

        run(async () => {
            await triggerEvent('.gh-input', 'focusout');
        });

        expect(this.get('text')).to.equal('some random stuff');
    });

    it('trims value on focusOut before calling custom focus-out', function () {
        this.set('text', 'some random stuff    ');
        this.set('customFocusOut', function (value) {
            expect(find('.gh-input').value, 'input value').to.equal('some random stuff');
            expect(value, 'value').to.equal('some random stuff');
        });

        this.render(hbs`{{gh-trim-focus-input
            value=(readonly text)
            input=(action (mut text) value="target.value")
            focus-out=(action customFocusOut)
        }}`);

        run(async () => {
            await triggerEvent('.gh-input', 'focusout');
        });

        expect(this.get('text')).to.equal('some random stuff');
    });

    it('does not have the autofocus attribute if not set to focus', function () {
        this.set('text', 'some text');
        this.render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=false}}`);
        expect(find('.gh-input').getAttribute('autofocus')).to.not.be.ok;
    });

    it('has the autofocus attribute if set to focus', function () {
        this.set('text', 'some text');
        this.render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        expect(find('.gh-input').getAttribute('autofocus')).to.be.ok;
    });

    it('handles undefined values', function () {
        this.set('text', undefined);
        this.render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        expect(find('.gh-input').getAttribute('autofocus')).to.be.ok;
    });

    it('handles non-string values', function () {
        this.set('text', 10);
        this.render(hbs`{{gh-trim-focus-input value=(readonly text) shouldFocus=true}}`);
        expect(find('.gh-input').value).to.equal('10');
    });
});
