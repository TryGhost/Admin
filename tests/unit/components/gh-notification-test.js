import localeConfig from 'ember-i18n/config/en';
import sinon from 'sinon';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {setupComponentTest} from 'ember-mocha';

describe('Unit: Component: gh-notification', function () {
    setupComponentTest('gh-notification', {
        unit: true,
        // specify the other units that are required for this test
        needs: [
            'service:notifications',
            'helper:svg-jar',
            'service:i18n',
            'locale:en/translations',
            'locale:en/config',
            'util:i18n/missing-message',
            'util:i18n/compile-template',
            'config:environment',
            'helper:t'
        ]
    });

    beforeEach(function () {
        getOwner(this).lookup('service:i18n').set('locale', 'en');
        this.register('locale:en/config', localeConfig);
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
