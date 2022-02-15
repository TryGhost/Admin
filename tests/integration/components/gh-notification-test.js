import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, find, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-notification', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        this.set('message', {message: 'Test message', type: 'success'});

        await render(hbs`{{gh-notification message=message}}`);

        assert.dom('article.gh-notification').exists();

        let notification = find('.gh-notification');
        assert.dom(notification).hasClass('gh-notification-passive');
        assert.dom(notification).hasText('Test message');
    });

    test('maps message types to CSS classes', async function (assert) {
        this.set('message', {message: 'Test message', type: 'success'});

        await render(hbs`{{gh-notification message=message}}`);
        let notification = find('.gh-notification');

        this.set('message.type', 'error');
        assert.dom(notification).hasClass('gh-notification-red', 'success class is red');

        this.set('message.type', 'warn');
        assert.dom(notification).hasClass('gh-notification-yellow', 'success class is yellow');
    });

    test('closes notification through notifications service', async function (assert) {
        let message = {message: 'Test close', type: 'success'};
        this.set('message', message);

        let notifications = this.owner.lookup('service:notifications');
        notifications.closeNotification = sinon.stub();

        await render(hbs`{{gh-notification message=message}}`);
        assert.dom('.gh-notification').exists();

        await click('[data-test-button="close-notification"]');

        assert.true(notifications.closeNotification.calledWith(message));
    });
});
