import localeConfig from 'ember-i18n/config/en';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {setupTest} from 'ember-mocha';

describe('Unit: Route: subscribers', function () {
    setupTest('route:subscribers', {
        needs: [
            'service:feature',
            'service:notifications',
            'service:session',
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

    it('exists', function () {
        let route = this.subject();
        expect(route).to.be.ok;
    });
});
