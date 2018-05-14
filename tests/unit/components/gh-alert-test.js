import localeConfig from 'ember-i18n/config/en';
import sinon from 'sinon';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {setupComponentTest} from 'ember-mocha';

describe('Unit: Component: gh-alert', function () {
    setupComponentTest('gh-alert', {
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
});
