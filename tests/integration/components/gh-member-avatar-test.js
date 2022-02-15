import hbs from 'htmlbars-inline-precompile';
import {module, test} from 'qunit';
import {render} from '@ember/test-helpers';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-member-avatar', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        this.set('member', {
            get(key) {
                if (key === 'name') {
                    return 'Homer Simpson';
                }
            }
        });

        await render(hbs`<GhMemberAvatar @member={{member}} />`);
        let avatar = this.element;
        assert.ok(avatar);
    });
});
