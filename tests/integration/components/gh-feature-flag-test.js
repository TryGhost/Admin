import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import {click, find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

const featureStub = Service.extend({
    testFlag: true
});

module('Integration: Component: gh-feature-flag', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.owner.register('service:feature', featureStub);
    });

    test('renders properties correctly', async function (assert) {
        await render(hbs`<GhFeatureFlag @flag="testFlag" />`);
        assert.strictEqual(find('label').getAttribute('for'), find('input[type="checkbox"]').id);
    });

    test('renders correctly when flag is set to true', async function (assert) {
        await render(hbs`<GhFeatureFlag @flag="testFlag" />`);
        assert.true(find('label input[type="checkbox"]').checked);
    });

    test('renders correctly when flag is set to false', async function (assert) {
        let feature = this.owner.lookup('service:feature');
        feature.set('testFlag', false);

        await render(hbs`<GhFeatureFlag @flag="testFlag" />`);
        assert.false(find('label input[type="checkbox"]').checked);
    });

    test('updates to reflect changes in flag property', async function (assert) {
        await render(hbs`<GhFeatureFlag @flag="testFlag" />`);
        assert.true(find('label input[type="checkbox"]').checked);

        await click('label');
        assert.false(find('label input[type="checkbox"]').checked);
    });
});
