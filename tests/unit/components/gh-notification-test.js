/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupComponentTest} from 'ember-mocha';
import sinon from 'sinon';

describe('Unit: Component: gh-notification', function () {
    setupComponentTest('gh-notification', {
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

    it('closes notification when animationend event is triggered', function (done) {
        let component = this.subject();
        let notifications = {};
        let notification = {message: 'Test close', type: 'success'};

        notifications.closeNotification = sinon.spy();
        component.set('notifications', notifications);
        component.set('message', notification);

        // shorten the animation delay to speed up test
        this.$().css('animation-delay', '0.1s');
        setTimeout(function () {
            expect(notifications.closeNotification.calledWith(notification)).to.be.true;
            done();
        }, 150);
    });
});
