import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import {expect} from 'chai';
import {find, findAll, render, settled} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

let notificationsStub = Service.extend({
    alerts: emberA()
});

module('Integration: Component: gh-alerts', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.owner.register('service:notifications', notificationsStub);
        let notifications = this.owner.lookup('service:notifications');

        notifications.set('alerts', [
            {message: 'First', type: 'error'},
            {message: 'Second', type: 'warn'}
        ]);
    });

    test('renders', async function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        await render(hbs`{{gh-alerts}}`);
        assert.strictEqual(findAll('.gh-alerts').length, 1);
        assert.strictEqual(find('.gh-alerts').children.length, 2);

        notifications.set('alerts', emberA());
        await settled();
        assert.strictEqual(find('.gh-alerts').children.length, 0);
    });

    test('triggers "notify" action when message count changes', async function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let expectedCount = 0;

        // test double for notify action
        this.set('notify', count => expect(count).to.equal(expectedCount));

        await render(hbs`{{gh-alerts notify=(action notify)}}`);

        expectedCount = 3;
        notifications.alerts.pushObject({message: 'Third', type: 'success'});
        await settled();

        expectedCount = 0;
        notifications.set('alerts', emberA());
        await settled();
    });
});
