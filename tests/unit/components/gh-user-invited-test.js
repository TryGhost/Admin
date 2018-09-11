import localeConfig from 'ember-i18n/config/en';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {setupComponentTest} from 'ember-mocha';

describe('Unit: Component: gh-user-invited', function () {
    setupComponentTest('gh-user-invited', {
        unit: true,
        // specify the other units that are required for this test
        needs: [
            'service:notifications',
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

    it('renders', function () {
        // creates the component instance
        let component = this.subject();

        expect(component._state).to.equal('preRender');

        // renders the component on the page
        this.render();
        expect(component._state).to.equal('inDOM');
    });
});
