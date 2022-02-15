import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, render} from '@ember/test-helpers';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

module('Integration: Component: gh-alert', function (hooks) {
    setupRenderingTest(hooks);

    test('renders', async function (assert) {
        this.set('message', {message: 'Test message', type: 'success'});

        await render(hbs`{{gh-alert message=message}}`);

        let alert = this.element.querySelector('article.gh-alert');
        assert.ok(alert);
        assert.dom(alert).hasText('Test message');
    });

    test('maps message types to CSS classes', async function (assert) {
        this.set('message', {message: 'Test message', type: 'success'});

        await render(hbs`{{gh-alert message=message}}`);
        let alert = this.element.querySelector('article.gh-alert');

        this.set('message.type', 'success');
        assert.dom(alert).hasClass('gh-alert-green', 'success class is green');

        this.set('message.type', 'error');
        assert.dom(alert).hasClass('gh-alert-red', 'error class is red');

        this.set('message.type', 'warn');
        assert.dom(alert).hasClass('gh-alert-blue', 'warn class is yellow');

        this.set('message.type', 'info');
        assert.dom(alert).hasClass('gh-alert-blue', 'info class is blue');
    });

    test('closes notification through notifications service', async function (assert) {
        let message = {message: 'Test close', type: 'success'};
        this.set('message', message);

        await render(hbs`{{gh-alert message=message}}`);
        assert.dom('article.gh-alert').exists();

        let notifications = this.owner.lookup('service:notifications');
        notifications.closeNotification = sinon.stub();

        await click('[data-test-button="close-notification"]');

        assert.true(notifications.closeNotification.calledWith(message));
    });
});
