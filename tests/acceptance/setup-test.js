import moment from 'moment';
import {Response} from 'miragejs';
import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {beforeEach, describe, it} from 'mocha';
import {blur, click, currentURL, fillIn, find, findAll} from '@ember/test-helpers';
import {enableLabsFlag} from '../helpers/labs-flag';
import {expect} from 'chai';
import {setupApplicationTest} from 'ember-mocha';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../helpers/visit';

describe('Acceptance: Setup', function () {
    let hooks = setupApplicationTest();
    setupMirage(hooks);

    beforeEach(function () {
        enableLabsFlag(this.server, 'improvedOnboarding');
    });

    it('redirects if already authenticated', async function () {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();

        await visit('/setup/one');
        expect(currentURL()).to.equal('/site');

        await visit('/setup/two');
        expect(currentURL()).to.equal('/site');
    });

    it('redirects to signin if already set up', async function () {
        // mimick an already setup blog
        this.server.get('/authentication/setup/', function () {
            return {
                setup: [
                    {status: true}
                ]
            };
        });

        await invalidateSession();

        await visit('/setup');
        expect(currentURL()).to.equal('/signin');
    });

    describe('with a new blog', function () {
        beforeEach(function () {
            // mimick a new blog
            this.server.get('/authentication/setup/', function () {
                return {
                    setup: [
                        {status: false}
                    ]
                };
            });
        });

        it('has a successful happy path', async function () {
            await invalidateSession();
            this.server.loadFixtures('roles');

            await visit('/setup');

            // it redirects to step one
            expect(currentURL(), 'url after accessing /setup')
                .to.equal('/setup/one');

            // it highlights first step
            let stepIcons = findAll('.gh-flow-nav .step');
            expect(stepIcons.length, 'sanity check: two steps').to.equal(2);
            expect(stepIcons[0], 'first step').to.have.class('active');
            expect(stepIcons[1], 'second step').to.not.have.class('active');

            await click('.gh-btn-green');

            // it transitions to step two
            expect(currentURL(), 'url after clicking "Create your account"')
                .to.equal('/setup/two');

            // email field is focused by default
            // NOTE: $('x').is(':focus') doesn't work in phantomjs CLI runner
            // https://github.com/ariya/phantomjs/issues/10427
            expect(findAll('[data-test-blog-title-input]')[0] === document.activeElement, 'blog title has focus')
                .to.be.true;

            await click('.gh-btn-green');

            // it marks fields as invalid
            expect(findAll('.form-group.error').length, 'number of invalid fields')
                .to.equal(4);

            // it displays error messages
            expect(findAll('.error .response').length, 'number of in-line validation messages')
                .to.equal(4);

            // it displays main error
            expect(findAll('.main-error').length, 'main error is displayed')
                .to.equal(1);

            // enter valid details and submit
            await fillIn('[data-test-email-input]', 'test@example.com');
            await fillIn('[data-test-name-input]', 'Test User');
            await fillIn('[data-test-password-input]', 'thisissupersafe');
            await fillIn('[data-test-blog-title-input]', 'Blog Title');
            await click('.gh-btn-green');

            // it redirects to the home / "content" screen
            expect(currentURL(), 'url after submitting step two')
                .to.equal('/dashboard');

            // submit button is "disabled"
            expect(find('button[type="submit"]').classList.contains('gh-btn-green'), 'invite button with no emails is white')
                .to.be.false;

            // fill in a valid email
            await fillIn('[name="users"]', 'new-user@example.com');

            // submit button is "enabled"
            expect(find('button[type="submit"]').classList.contains('gh-btn-green'), 'invite button is green with valid email address')
                .to.be.true;

            // submit the invite form
            await click('button[type="submit"]');

            // it displays success alert
            expect(findAll('.gh-alert-green').length, 'number of success alerts')
                .to.equal(1);

            // it opens get-started modal
            expect(find('[data-test-modal="get-started"]')).to.exist;
        });

        it('handles validation errors in step 2', async function () {
            let postCount = 0;

            await invalidateSession();
            this.server.loadFixtures('roles');

            this.server.post('/authentication/setup', function () {
                postCount += 1;

                // validation error
                if (postCount === 1) {
                    return new Response(422, {}, {
                        errors: [
                            {
                                type: 'ValidationError',
                                message: 'Server response message'
                            }
                        ]
                    });
                }

                // server error
                if (postCount === 2) {
                    return new Response(500, {}, null);
                }
            });

            await visit('/setup/two');
            await click('.gh-btn-green');

            // non-server validation
            expect(find('.main-error').textContent.trim(), 'error text')
                .to.not.be.empty;

            await fillIn('[data-test-email-input]', 'test@example.com');
            await fillIn('[data-test-name-input]', 'Test User');
            await fillIn('[data-test-password-input]', 'thisissupersafe');
            await fillIn('[data-test-blog-title-input]', 'Blog Title');

            // first post - simulated validation error
            await click('.gh-btn-green');

            expect(find('.main-error').textContent.trim(), 'error text')
                .to.equal('Server response message');

            // second post - simulated server error
            await click('.gh-btn-green');

            expect(find('.main-error').textContent.trim(), 'error text')
                .to.be.empty;

            expect(findAll('.gh-alert-red').length, 'number of alerts')
                .to.equal(1);
        });

        it('handles invalid origin error on step 2', async function () {
            // mimick the API response for an invalid origin
            this.server.post('/session', function () {
                return new Response(401, {}, {
                    errors: [
                        {
                            type: 'UnauthorizedError',
                            message: 'Access Denied from url: unknown.com. Please use the url configured in config.js.'
                        }
                    ]
                });
            });

            await invalidateSession();
            this.server.loadFixtures('roles');

            await visit('/setup/two');
            await fillIn('[data-test-email-input]', 'test@example.com');
            await fillIn('[data-test-name-input]', 'Test User');
            await fillIn('[data-test-password-input]', 'thisissupersafe');
            await fillIn('[data-test-blog-title-input]', 'Blog Title');
            await click('.gh-btn-green');

            // button should not be spinning
            expect(findAll('.gh-btn-green .spinner').length, 'button has spinner')
                .to.equal(0);
            // we should show an error message
            expect(find('.main-error').textContent, 'error text')
                .to.have.string('Access Denied from url: unknown.com. Please use the url configured in config.js.');
        });
    });

    describe('?firstStart=true', function () {
        beforeEach(async function () {
            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role], slug: 'owner'});

            await authenticateSession();
        });

        it('transitions to done screen', async function () {
            await visit('/?firstStart=true');
            expect(currentURL()).to.equal('/setup/done');
        });
    });
});
