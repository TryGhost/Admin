import hbs from 'htmlbars-inline-precompile';
import {module, test} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-unsplash', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        // Set any properties with this.set('myProperty', 'value');
        // Handle any actions with this.on('myAction', function(val) { ... });
        // Template block usage:
        // await render(hbs`
        //   {{#gh-unsplash}}
        //     template content
        //   {{/gh-unsplash}}
        // `);

        await render(hbs`{{gh-unsplash}}`);
        assert.ok(this.element);
    });

    test('loads new photos by default');
    test('has responsive columns');
    test('can zoom');
    test('can close zoom by clicking on image');
    test('can close zoom by clicking outside image');
    test('triggers insert action');
    test('handles errors');

    module('searching', function () {
        test('works');
        test('handles no results');
        test('handles error');
    });

    module('closing', function () {
        test('triggers close action');
        test('can be triggerd by escape key');
        test('cannot be triggered by escape key when zoomed');
    });
});
