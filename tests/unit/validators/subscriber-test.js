import EmberObject from '@ember/object';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import localeConfig from 'ember-i18n/config/en';
import {
    describe,
    it
} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {run} from '@ember/runloop';
import {setupComponentTest} from 'ember-mocha';

const Subscriber = EmberObject.extend(ValidationEngine, {
    validationType: 'subscriber',

    email: null
});

describe('Unit: Validator: subscriber', function () {
    setupComponentTest('gh-app', {
        unit: true,
        // specify the other units that are required for this test
        needs: [
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
        this.register('locale:en/config', localeConfig);
        getOwner(this).lookup('service:i18n').set('locale', 'en');
    });

    it('validates email by default', function () {
        let subscriber = Subscriber.create({});
        subscriber.validators.subscriber.set('i18n', getOwner(this).lookup('service:i18n'));
        let properties = subscriber.get('validators.subscriber.properties');

        expect(properties, 'properties').to.include('email');
    });

    it('passes with a valid email', function () {
        let subscriber = Subscriber.create({email: 'test@example.com'});
        subscriber.validators.subscriber.set('i18n', getOwner(this).lookup('service:i18n'));
        let passed = false;

        run(() => {
            subscriber.validate({property: 'email'}).then(() => {
                passed = true;
            });
        });

        expect(passed, 'passed').to.be.true;
        expect(subscriber.get('hasValidated'), 'hasValidated').to.include('email');
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
        expect(emailErrors.message, 'errors.email.message').to.equal('Please enter an email.');

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
        expect(emailErrors.message, 'errors.email.message').to.equal('Invalid Email.');

        expect(passed, 'passed').to.be.false;
        expect(subscriber.get('hasValidated'), 'hasValidated').to.include('email');
    });
});
