/* jshint expr:true */
import { expect } from 'chai';
import {
    describe,
    it
} from 'mocha';
import Changeset from 'ghost-admin/changeset';
import EmberObject from 'ember-object';
import {isEmberArray} from 'ember-array/utils';

describe('Unit: Changeset', function() {
    let testObject;

    beforeEach(() => {
        testObject = EmberObject.create({
            firstName: 'test',
            lastName: 'user'
        });
    });

    it('correctly creates changeset object', function () {
        let subject = new Changeset(testObject, {
            firstName() {},
            lastName() {}
        });

        expect(isEmberArray(subject.get('hasValidated'))).to.be.true;
    });

    it('correctly validates one property', function (done) {
        let subject = new Changeset(testObject, {
            firstName(key, newValue, oldValue) {
                expect(key).to.equal('firstName');
                expect(oldValue).to.equal('test');
                expect(newValue).to.equal('joe');

                return 'invalid new firstName';
            },

            lastName() {
                expect(true, 'lastName should not be called').to.be.false;
            }
        });

        subject.set('firstName', 'joe');

        subject.validate('firstName').then(() => {
            expect(subject.get('firstName')).to.equal('test');
            expect(subject.get('isInvalid')).to.be.true;
            expect(subject.get('error.firstName.validation')).to.be.ok;
            expect(subject.get('error.lastName')).to.not.be.ok;
            expect(subject.get('hasValidated').contains('firstName')).to.be.true;
            done();
        });
    });

    it('correctly validates all properties', function (done) {
        let subject = new Changeset(testObject, {
            firstName(key, newValue, oldValue) {
                expect(newValue).to.not.be.ok;
                expect(oldValue).to.equal('test');

                return 'some error message';
            },

            lastName(key, newValue, oldValue) {
                expect(newValue).to.not.be.ok;
                expect(oldValue).to.equal('user');

                return 'another error message';
            }
        });

        subject.validate().then(() => {
            expect(subject.get('firstName')).to.equal('test');
            expect(subject.get('lastName')).to.equal('user');
            expect(subject.get('hasValidated').contains('firstName')).to.be.true;
            expect(subject.get('hasValidated').contains('lastName')).to.be.true;

            done();
        });
    });
});
