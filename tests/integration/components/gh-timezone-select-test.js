import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {blur, fillIn, find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-timezone-select', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.set('availableTimezones', [
            {name: 'Pacific/Pago_Pago', label: '(GMT -11:00) Midway Island, Samoa'},
            {name: 'Etc/UTC', label: '(GMT) UTC'},
            {name: 'Pacific/Kwajalein', label: '(GMT +12:00) International Date Line West'}
        ]);
        this.set('timezone', 'Etc/UTC');
    });

    test('renders', async function (assert) {
        await render(hbs`{{gh-timezone-select
            availableTimezones=availableTimezones
            timezone=timezone}}`);

        assert.ok(this.element, 'top-level elements');
        assert.dom('option').exists({count: 3}, 'number of options');
        assert.strictEqual(find('select').value, 'Etc/UTC', 'selected option value');
    });

    test('handles an unknown timezone', async function (assert) {
        this.set('timezone', 'Europe/London');

        await render(hbs`{{gh-timezone-select
            availableTimezones=availableTimezones
            timezone=timezone}}`);

        // we have an additional blank option at the top
        assert.dom('option').exists({count: 4}, 'number of options');
        // blank option is selected
        assert.strictEqual(find('select').value, '', 'selected option value');
        // we indicate the manual override
        assert.match(find('p').textContent, /Your timezone has been automatically set to Europe\/London/);
    });

    test('triggers update action on change', async function (assert) {
        let update = sinon.spy();
        this.set('update', update);

        await render(hbs`{{gh-timezone-select
            availableTimezones=availableTimezones
            timezone=timezone
            update=(action update)}}`);

        await fillIn('select', 'Pacific/Pago_Pago');
        await blur('select');

        assert.true(update.calledOnce, 'update was called once');
        assert.strictEqual(update.firstCall.args[0].name, 'Pacific/Pago_Pago', 'update was passed new timezone');
    });

    // TODO: mock clock service, fake the time, test we have the correct
    // local time and it changes alongside selection changes
    test('renders local time');
});
