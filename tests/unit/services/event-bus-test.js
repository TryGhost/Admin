import sinon from 'sinon';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

module('Unit: Service: event-bus', function (hooks) {
    setupTest(hooks);

    test('works', function (assert) {
        let service = this.owner.lookup('service:event-bus');
        let eventHandler = sinon.spy();

        service.subscribe('test-event', this, eventHandler);

        service.publish('test-event', 'test');

        service.unsubscribe('test-event', this, eventHandler);

        service.publish('test-event', 'test two');

        assert.true(eventHandler.calledOnce, 'event handler only triggered once');

        assert.true(eventHandler.calledWith('test'), 'event handler was passed correct arguments');
    });
});
