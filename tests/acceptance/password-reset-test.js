import destroyApp from '../helpers/destroy-app';
import startApp from '../helpers/start-app';
import {afterEach, beforeEach, describe, it} from 'mocha';
import {expect} from 'chai';

describe('Acceptance: Password Reset', function () {
    let application;

    beforeEach(function () {
        application = startApp();
    });

    afterEach(function () {
        destroyApp(application);
    });

    describe('request reset', function () {
        it('is successful with valid data', async function () {
            await visit('/signin');
            await fillIn('input[name="identification"]', 'test@example.com');
            await click('.forgotten-link');

            // an alert with instructions is displayed
            expect(find('.gh-alert-blue').length, 'alert count')
                .to.equal(1);
        });

        it('shows error messages with invalid data', async function () {
            await visit('/signin');

            // no email provided
            await click('.forgotten-link');

            // email field is invalid
            expect(
                find('input[name="identification"]').closest('.form-group').hasClass('error'),
                'email field has error class (no email)'
            ).to.be.true;

            // password field is valid
            expect(
                find('input[name="password"]').closest('.form-group').hasClass('error'),
                'password field has error class (no email)'
            ).to.be.false;

            // error message shown
            expect(find('p.main-error').text().trim(), 'error message')
                .to.equal('We need your email address to reset your password!');

            // invalid email provided
            await fillIn('input[name="identification"]', 'test');
            await click('.forgotten-link');

            // email field is invalid
            expect(
                find('input[name="identification"]').closest('.form-group').hasClass('error'),
                'email field has error class (invalid email)'
            ).to.be.true;

            // password field is valid
            expect(
                find('input[name="password"]').closest('.form-group').hasClass('error'),
                'password field has error class (invalid email)'
            ).to.be.false;

            // error message
            expect(find('p.main-error').text().trim(), 'error message')
                .to.equal('We need your email address to reset your password!');

            // unknown email provided
            await fillIn('input[name="identification"]', 'unknown@example.com');
            await click('.forgotten-link');

            // email field is invalid
            expect(
                find('input[name="identification"]').closest('.form-group').hasClass('error'),
                'email field has error class (unknown email)'
            ).to.be.true;

            // password field is valid
            expect(
                find('input[name="password"]').closest('.form-group').hasClass('error'),
                'password field has error class (unknown email)'
            ).to.be.false;

            // error message
            expect(find('p.main-error').text().trim(), 'error message')
                .to.equal('There is no user with that email address.');
        });
    });

    // TODO: add tests for the change password screen
});
