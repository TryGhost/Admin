import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import {find, render, settled} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

let notificationsStub = Service.extend({
    notifications: emberA()
});

module('Integration: Component: gh-notifications', function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
        this.owner.register('service:notifications', notificationsStub);
        let notifications = this.owner.lookup('service:notifications');

        notifications.set('notifications', [
            {message: 'First', type: 'error'},
            {message: 'Second', type: 'warn'}
        ]);
    });

    test('renders', async function (assert) {
        await render(hbs`{{gh-notifications}}`);
        assert.dom('.gh-notifications').exists();

        assert.strictEqual(find('.gh-notifications').children.length, 2);

        let notifications = this.owner.lookup('service:notifications');
        notifications.set('notifications', emberA());
        await settled();
        assert.strictEqual(find('.gh-notifications').children.length, 0);
    });
});
