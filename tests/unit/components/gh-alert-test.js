/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import sinon from 'sinon';

describe('Unit: Component: gh-alert', function () {
    setupComponentTest('gh-alert', {
        unit: true
        // specify the other units that are required for this test
        // needs: ['component:foo', 'helper:bar']
    });

    it('closes notification through notifications service', function () {
        let component = this.subject();
        let notifications = {};
        let notification = {message: 'Test close', type: 'success'};

        notifications.closeNotification = sinon.spy();
        component.set('notifications', notifications);
        component.set('message', notification);

        this.$().find('button').click();

        expect(notifications.closeNotification.calledWith(notification)).to.be.true;
    });
});
