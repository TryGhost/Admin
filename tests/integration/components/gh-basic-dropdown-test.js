import hbs from 'htmlbars-inline-precompile';
import {clickTrigger} from 'ember-basic-dropdown/test-support/helpers';
import {module, test} from 'qunit';
import {render, settled} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-basic-dropdown', function (hooks) {
    setupRenderingTest(hooks);

    test('closes when dropdown service fires close event', async function (assert) {
        let dropdownService = this.owner.lookup('service:dropdown');

        await render(hbs`
            <GhBasicDropdown as |dropdown|>
                <dropdown.Trigger>Click me!</dropdown.Trigger>
                <dropdown.Content><div id="dropdown-is-opened">Content of the trigger</div></dropdown.Content>
            </GhBasicDropdown>
        `);

        await clickTrigger();
        assert.dom('#dropdown-is-opened').exists();

        dropdownService.closeDropdowns();
        await settled();

        assert.dom('#dropdown-is-opened').doesNotExist();
    });
});
