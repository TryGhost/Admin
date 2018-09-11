import localeConfig from 'ember-i18n/config/en';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {setupModelTest} from 'ember-mocha';

describe('Unit: Serializer: user', function () {
    setupModelTest('user', {
        // Specify the other units that are required for this test.
        needs: [
            'model:role',
            'service:ajax',
            'service:config',
            'service:ghostPaths',
            'service:notifications',
            'service:session',
            'transform:facebook-url-user',
            'transform:json-string',
            'transform:moment-utc',
            'transform:raw',
            'transform:twitter-url-user',
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

    // Replace this with your real tests.
    it('serializes records', function () {
        let record = this.subject();

        let serializedRecord = record.serialize();

        expect(serializedRecord).to.be.ok;
    });
});
