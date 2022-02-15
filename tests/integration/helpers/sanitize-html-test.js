import hbs from 'htmlbars-inline-precompile';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Helper: sanitize-html', function (hooks) {
    setupRenderingTest(hooks);

    test('renders html', async function (assert) {
        this.set('inputValue', '<strong>bold</strong>');

        await render(hbs`{{{sanitize-html inputValue}}}`);

        expect(this.element).to.have.trimmed.html('<strong>bold</strong>');
    });

    test('replaces scripts', async function (assert) {
        this.set('inputValue', '<script></script>');

        await render(hbs`{{{sanitize-html inputValue}}}`);

        expect(this.element).to.have.trimmed.html('<pre class="js-embed-placeholder">Embedded JavaScript</pre>');
    });
});

