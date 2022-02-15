import EmberObject from '@ember/object';
import sinon from 'sinon';
import {AjaxError, InvalidError} from 'ember-ajax/errors';
import {ServerUnreachableError} from 'ghost-admin/services/ajax';
import {get} from '@ember/object';
import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-qunit';

// notifications service determines if a notification is a model instance by
// checking `notification.constructor.modelName === 'notification'`
const NotificationStub = EmberObject.extend();
NotificationStub.modelName = 'notification';

module('Unit: Service: notifications', function (hooks) {
    setupTest(hooks);

    beforeEach(function () {
        this.owner.lookup('service:notifications').set('content', emberA());
        this.owner.lookup('service:notifications').set('delayedNotifications', emberA());
    });

    test('filters alerts/notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        // wrapped in run-loop to enure alerts/notifications CPs are updated
        run(() => {
            notifications.showAlert('Alert');
            notifications.showNotification('Notification');
        });

        assert.strictEqual(notifications.get('alerts.length'), 1);
        assert.strictEqual(notifications.get('alerts.firstObject.message'), 'Alert');

        assert.strictEqual(notifications.get('notifications.length'), 1);
        assert.strictEqual(notifications.get('notifications.firstObject.message'), 'Notification');
    });

    test('#handleNotification deals with DS.Notification notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let notification = NotificationStub.create({message: '<h1>Test</h1>', status: 'alert'});

        notifications.handleNotification(notification);

        notification = notifications.get('alerts')[0];

        // alerts received from the server should be marked html safe
        assert.deepIncludes(notification.get('message'), ['toHTML']);
    });

    test('#handleNotification defaults to notification if no status supplied', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        notifications.handleNotification({message: 'Test'}, false);

        assert.includes(notifications.get('content'), {message: 'Test', status: 'notification'});
    });

    test('#showAlert adds POJO alerts', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAlert('Test Alert', {type: 'error'});
        });

        assert.includes(notifications.get('alerts'), {message: 'Test Alert', status: 'alert', type: 'error', key: undefined, actions: undefined, description: undefined, icon: undefined});
    });

    test('#showAlert adds delayed notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showNotification('Test Alert', {type: 'error', delayed: true});
        });

        assert.includes(notifications.get('delayedNotifications'), {message: 'Test Alert', status: 'notification', type: 'error', key: undefined, actions: undefined, description: undefined, icon: undefined});
    });

    // in order to cater for complex keys that are suitable for i18n
    // we split on the second period and treat the resulting base as
    // the key for duplicate checking
    test('#showAlert clears duplicates using keys', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAlert('Kept');
            notifications.showAlert('Duplicate', {key: 'duplicate.key.fail'});
        });

        assert.strictEqual(notifications.get('alerts.length'), 2);

        run(() => {
            notifications.showAlert('Duplicate with new message', {key: 'duplicate.key.success'});
        });

        assert.strictEqual(notifications.get('alerts.length'), 2);
        assert.strictEqual(notifications.get('alerts.lastObject.message'), 'Duplicate with new message');
    });

    test('#showAlert clears duplicates using message text', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        notifications.showAlert('Not duplicate');
        notifications.showAlert('Duplicate', {key: 'duplicate'});
        notifications.showAlert('Duplicate');

        assert.strictEqual(notifications.get('alerts.length'), 2);
        assert.notOk(notifications.get('alerts.lastObject.key'));
    });

    test('#showNotification adds POJO notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showNotification('Test Notification', {type: 'success'});
        });

        assert.includes(notifications.get('notifications'), {message: 'Test Notification', status: 'notification', type: 'success', key: undefined, actions: undefined, description: undefined, icon: undefined});
    });

    test('#showNotification adds delayed notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showNotification('Test Notification', {delayed: true});
        });

        assert.includes(notifications.get('delayedNotifications'), {message: 'Test Notification', status: 'notification', type: undefined, key: undefined, actions: undefined, description: undefined, icon: undefined});
    });

    test('#showAPIError handles single json response error', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let error = new AjaxError({errors: [{message: 'Single error'}]});

        run(() => {
            notifications.showAPIError(error);
        });

        let alert = notifications.get('alerts.firstObject');
        assert.strictEqual(get(alert, 'message'), 'Single error');
        assert.strictEqual(get(alert, 'status'), 'alert');
        assert.strictEqual(get(alert, 'type'), 'error');
        assert.strictEqual(get(alert, 'key'), 'api-error');
    });

    test('#showAPIError handles multiple json response errors', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let error = new AjaxError({errors: [
            {title: 'First error', message: 'First error message'},
            {title: 'Second error', message: 'Second error message'}
        ]});

        run(() => {
            notifications.showAPIError(error);
        });

        assert.strictEqual(notifications.get('alerts.length'), 2);
        let [alert1, alert2] = notifications.get('alerts');
        assert.deepEqual(alert1, {message: 'First error message', status: 'alert', type: 'error', key: 'api-error.first-error', actions: undefined, description: undefined, icon: undefined});
        assert.deepEqual(alert2, {message: 'Second error message', status: 'alert', type: 'error', key: 'api-error.second-error', actions: undefined, description: undefined, icon: undefined});
    });

    test('#showAPIError displays default error text if response has no error/message', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let resp = false;

        run(() => {
            notifications.showAPIError(resp);
        });
        assert.deepEqual(notifications.get('content').toArray(), [
            {message: 'There was a problem on the server, please try again.', status: 'alert', type: 'error', key: 'api-error', actions: undefined, description: undefined, icon: undefined}
        ]);

        notifications.set('content', emberA());

        run(() => {
            notifications.showAPIError(resp, {defaultErrorText: 'Overridden default'});
        });
        assert.deepEqual(notifications.get('content').toArray(), [
            {message: 'Overridden default', status: 'alert', type: 'error', key: 'api-error', actions: undefined, description: undefined, icon: undefined}
        ]);
    });

    test('#showAPIError sets correct key when passed a base key', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAPIError('Test', {key: 'test.alert'});
        });

        assert.strictEqual(notifications.get('alerts.firstObject.key'), 'api-error.test.alert');
    });

    test('#showAPIError sets correct key when not passed a key', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAPIError('Test');
        });

        assert.strictEqual(notifications.get('alerts.firstObject.key'), 'api-error');
    });

    test('#showAPIError parses default ember-ajax errors correctly', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let error = new InvalidError();

        run(() => {
            notifications.showAPIError(error);
        });

        let notification = notifications.get('alerts.firstObject');
        assert.strictEqual(get(notification, 'message'), 'Request was rejected because it was invalid');
        assert.strictEqual(get(notification, 'status'), 'alert');
        assert.strictEqual(get(notification, 'type'), 'error');
        assert.strictEqual(get(notification, 'key'), 'api-error');
    });

    test('#showAPIError parses custom ember-ajax errors correctly', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let error = new ServerUnreachableError();

        run(() => {
            notifications.showAPIError(error);
        });

        let notification = notifications.get('alerts.firstObject');
        assert.strictEqual(get(notification, 'message'), 'Server was unreachable');
        assert.strictEqual(get(notification, 'status'), 'alert');
        assert.strictEqual(get(notification, 'type'), 'error');
        assert.strictEqual(get(notification, 'key'), 'api-error');
    });

    test('#showAPIError adds error context to message if available', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let error = new AjaxError({errors: [{
            message: 'Authorization Error.',
            module: 'Please sign in.'
        }]});

        run(() => {
            notifications.showAPIError(error);
        });

        let alert = notifications.get('alerts.firstObject');
        assert.strictEqual(get(alert, 'message'), 'Authorization Error. Please sign in.');
        assert.strictEqual(get(alert, 'status'), 'alert');
        assert.strictEqual(get(alert, 'type'), 'error');
        assert.strictEqual(get(alert, 'key'), 'api-error');
    });

    test('#displayDelayed moves delayed notifications into content', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showNotification('First', {delayed: true});
            notifications.showNotification('Second', {delayed: true});
            notifications.showNotification('Third', {delayed: false});
            notifications.displayDelayed();
        });

        assert.deepEqual(notifications.get('notifications'), [
            {message: 'Third', status: 'notification', type: undefined, key: undefined, actions: undefined, description: undefined, icon: undefined},
            {message: 'First', status: 'notification', type: undefined, key: undefined, actions: undefined, description: undefined, icon: undefined},
            {message: 'Second', status: 'notification', type: undefined, key: undefined, actions: undefined, description: undefined, icon: undefined}
        ]);
    });

    test('#closeNotification removes POJO notifications', function (assert) {
        let notification = {message: 'Close test', status: 'notification'};
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.handleNotification(notification);
        });

        assert.includes(notifications.get('notifications'), notification);

        run(() => {
            notifications.closeNotification(notification);
        });

        assert.notIncludes(notifications.get('notifications'), notification);
    });

    test('#closeNotification removes and deletes DS.Notification records', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let notification = NotificationStub.create({message: 'Close test', status: 'alert'});

        notification.deleteRecord = function () {};
        sinon.spy(notification, 'deleteRecord');
        notification.save = function () {
            return {
                finally(callback) {
                    return callback(notification);
                }
            };
        };
        sinon.spy(notification, 'save');

        run(() => {
            notifications.handleNotification(notification);
        });

        assert.includes(notifications.get('alerts'), notification);

        run(() => {
            notifications.closeNotification(notification);
        });

        assert.true(notification.deleteRecord.calledOnce);
        assert.true(notification.save.calledOnce);

        assert.notIncludes(notifications.get('alerts'), notification);
    });

    test('#closeNotifications only removes notifications', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAlert('First alert');
            notifications.showNotification('First notification');
            notifications.showNotification('Second notification');
        });

        assert.strictEqual(notifications.get('alerts.length'), 1, 'alerts count');
        assert.strictEqual(notifications.get('notifications.length'), 2, 'notifications count');

        run(() => {
            notifications.closeNotifications();
        });

        assert.strictEqual(notifications.get('alerts.length'), 1, 'alerts count');
        assert.strictEqual(notifications.get('notifications.length'), 0, 'notifications count');
    });

    test('#closeNotifications only closes notifications with specified key', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        run(() => {
            notifications.showAlert('First alert');
            // using handleNotification as showNotification will auto-prune duplicates
            notifications.handleNotification({message: 'First notification', key: 'test.close', status: 'notification'});
            notifications.handleNotification({message: 'Second notification', key: 'test.keep', status: 'notification'});
            notifications.handleNotification({message: 'Third notification', key: 'test.close', status: 'notification'});
        });

        run(() => {
            notifications.closeNotifications('test.close');
        });

        assert.strictEqual(notifications.get('notifications.length'), 1, 'notifications count');
        assert.strictEqual(notifications.get('notifications.firstObject.message'), 'Second notification', 'notification message');
        assert.strictEqual(notifications.get('alerts.length'), 1, 'alerts count');
    });

    test('#clearAll removes everything without deletion', function (assert) {
        let notifications = this.owner.lookup('service:notifications');
        let notificationModel = EmberObject.create({message: 'model'});

        notificationModel.deleteRecord = function () {};
        sinon.spy(notificationModel, 'deleteRecord');
        notificationModel.save = function () {
            return {
                finally(callback) {
                    return callback(notificationModel);
                }
            };
        };
        sinon.spy(notificationModel, 'save');

        notifications.handleNotification(notificationModel);
        notifications.handleNotification({message: 'pojo'});

        notifications.clearAll();

        assert.notOk(notifications.get('content'));
        assert.false(notificationModel.deleteRecord.called);
        assert.false(notificationModel.save.called);
    });

    test('#closeAlerts only removes alerts', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        notifications.showNotification('First notification');
        notifications.showAlert('First alert');
        notifications.showAlert('Second alert');

        run(() => {
            notifications.closeAlerts();
        });

        assert.strictEqual(notifications.get('alerts.length'), 0);
        assert.strictEqual(notifications.get('notifications.length'), 1);
    });

    test('#closeAlerts closes only alerts with specified key', function (assert) {
        let notifications = this.owner.lookup('service:notifications');

        notifications.showNotification('First notification');
        notifications.showAlert('First alert', {key: 'test.close'});
        notifications.showAlert('Second alert', {key: 'test.keep'});
        notifications.showAlert('Third alert', {key: 'test.close'});

        run(() => {
            notifications.closeAlerts('test.close');
        });

        assert.strictEqual(notifications.get('alerts.length'), 1);
        assert.strictEqual(notifications.get('alerts.firstObject.message'), 'Second alert');
        assert.strictEqual(notifications.get('notifications.length'), 1);
    });
});
