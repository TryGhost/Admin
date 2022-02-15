import hbs from 'htmlbars-inline-precompile';
import {module, skip} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-whats-new', function (hooks) {
    setupRenderingTest(hooks);

    skip('renders', async function (assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.set('myAction', function(val) { ... });

        await render(hbs`<GhWhatsNew />`);

        assert.strictEqual(this.element.textContent.trim(), '');

        // Template block usage:
        await render(hbs`
      <GhWhatsNew>
        template block text
      </GhWhatsNew>
    `);

        assert.strictEqual(this.element.textContent.trim(), 'template block text');
    });
});
