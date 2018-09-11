import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import localeConfig from 'ember-i18n/config/fr';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {run} from '@ember/runloop';
import {setupComponentTest} from 'ember-mocha';

const Subscriber = EmberObject.extend(ValidationEngine, {
    validationType: 'subscriber',

    email: null
});

const translations = {
    validation: {
        //translated by Google's service
        'Please enter an email.': 'S\'il vous plaît entrer un email.',
        'Invalid Email.': 'Email invalide.'
    }
};

describe('Unit: Validator: i18n subscriber', function () {
    setupComponentTest('gh-app', {
        unit: true,
        // specify the other units that are required for this test
        needs: [
            'service:i18n',
            'util:i18n/missing-message',
            'util:i18n/compile-template',
            'config:environment',
            'helper:t'
        ]
    });

    beforeEach(function () {
        this.register('locale:fr/config', localeConfig);
        getOwner(this).lookup('service:i18n').set('locale', 'fr');
        getOwner(this).lookup('service:i18n').addTranslations('fr', translations);
    });

    it('validates email presence', function () {
        let subscriber = Subscriber.create({});
        subscriber.validators.subscriber.set('i18n', getOwner(this).lookup('service:i18n'));
        let passed = false;

        run(() => {
            subscriber.validate({property: 'email'}).then(() => {
                passed = true;
            });
        });

        let emailErrors = subscriber.get('errors').errorsFor('email').get(0);
        expect(emailErrors.attribute, 'errors.email.attribute').to.equal('email');
        expect(emailErrors.message, 'errors.email.message').to.equal(translations.validation['Please enter an email.']);

        expect(passed, 'passed').to.be.false;
        expect(subscriber.get('hasValidated'), 'hasValidated').to.include('email');
    });

    it('validates email', function () {
        let subscriber = Subscriber.create({email: 'foo'});
        subscriber.validators.subscriber.set('i18n', getOwner(this).lookup('service:i18n'));
        let passed = false;

        run(() => {
            subscriber.validate({property: 'email'}).then(() => {
                passed = true;
            });
        });

        let emailErrors = subscriber.get('errors').errorsFor('email').get(0);
        expect(emailErrors.attribute, 'errors.email.attribute').to.equal('email');
        expect(emailErrors.message, 'errors.email.message').to.equal(translations.validation['Invalid Email.']);

        expect(passed, 'passed').to.be.false;
        expect(subscriber.get('hasValidated'), 'hasValidated').to.include('email');
    });
});
