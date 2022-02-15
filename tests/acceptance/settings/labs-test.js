import {authenticateSession, invalidateSession} from 'ember-simple-auth/test-support';
import {click, currentURL, fillIn, findAll} from '@ember/test-helpers';
import {fileUpload} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {setupApplicationTest} from 'ember-qunit';
import {setupMirage} from 'ember-cli-mirage/test-support';
import {visit} from '../../helpers/visit';
// import wait from 'ember-test-helpers/wait';
// import {timeout} from 'ember-concurrency';

module('Acceptance: Settings - Labs', function (hooks) {
    setupApplicationTest(hooks);
    setupMirage(hooks);

    test('redirects to signin when not authenticated', async function (assert) {
        await invalidateSession();
        await visit('/settings/labs');

        assert.strictEqual(currentURL(), '/signin', 'currentURL');
    });

    test('redirects to home page when authenticated as contributor', async function (assert) {
        let role = this.server.create('role', {name: 'Contributor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/labs');

        assert.strictEqual(currentURL(), '/posts', 'currentURL');
    });

    test('redirects to home page when authenticated as author', async function (assert) {
        let role = this.server.create('role', {name: 'Author'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/labs');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    test('redirects to home page when authenticated as editor', async function (assert) {
        let role = this.server.create('role', {name: 'Editor'});
        this.server.create('user', {roles: [role], slug: 'test-user'});

        await authenticateSession();
        await visit('/settings/labs');

        assert.strictEqual(currentURL(), '/site', 'currentURL');
    });

    module('when logged in', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Administrator'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test.skip('it renders, loads modals correctly', async function (assert) {
            await visit('/settings/labs');

            // has correct url
            assert.strictEqual(currentURL(), '/settings/labs', 'currentURL');

            // has correct page title
            assert.strictEqual(document.title, 'Settings - Labs - Test Blog', 'page title');

            // highlights nav menu
            assert.dom('[data-test-nav="labs"]').hasClass('active', 'highlights nav menu item');

            await click('#settings-resetdb .js-delete');
            assert.strictEqual(findAll('.fullscreen-modal .modal-content').length, 1, 'modal element');

            await click('.fullscreen-modal .modal-footer .gh-btn');
            assert.strictEqual(findAll('.fullscreen-modal').length, 0, 'modal element');
        });

        test('can upload/download redirects', async function (assert) {
            await visit('/settings/labs');

            // successful upload
            this.server.post('/redirects/upload/', {}, 200);

            await fileUpload(
                '[data-test-file-input="redirects"] input',
                ['test'],
                {name: 'redirects.json', type: 'application/json'}
            );

            // TODO: tests for the temporary success/failure state have been
            // disabled because they were randomly failing

            // this should be half-way through button reset timeout
            // await timeout(50);
            //
            // // shows success button
            // let buttons = findAll('[data-test-button="upload-redirects"]');
            // expect(buttons.length, 'no of success buttons').to.equal(1);
            // expect(
            //     buttons[0],
            //     'success button is green'
            // ).to.have.class('gh-btn-green);
            // expect(
            //     button.textContent,
            //     'success button text'
            // ).to.have.string('Uploaded');
            //
            // await wait();

            // returned to normal button
            let buttons = findAll('[data-test-button="upload-redirects"]');
            assert.strictEqual(buttons.length, 1, 'no of post-success buttons');
            assert.dom(buttons[0]).doesNotHaveClass('gh-btn-green', 'post-success button doesn\'t have success class');
            assert.dom(buttons[0]).containsText('Upload redirects', 'post-success button text');

            // failed upload
            this.server.post('/redirects/upload/', {
                errors: [{
                    type: 'BadRequestError',
                    message: 'Test failure message'
                }]
            }, 400);

            await fileUpload(
                '[data-test-file-input="redirects"] input',
                ['test'],
                {name: 'redirects-bad.json', type: 'application/json'}
            );

            // TODO: tests for the temporary success/failure state have been
            // disabled because they were randomly failing

            // this should be half-way through button reset timeout
            // await timeout(50);
            //
            // shows failure button
            // buttons = findAll('[data-test-button="upload-redirects"]');
            // expect(buttons.length, 'no of failure buttons').to.equal(1);
            // expect(
            //     buttons[0],
            //     'failure button is red'
            // ).to.have.class('gh-btn-red);
            // expect(
            //     buttons[0].textContent,
            //     'failure button text'
            // ).to.have.string('Upload Failed');
            //
            // await wait();

            // shows error message
            assert.dom('[data-test-error="redirects"]').containsText('Test failure message', 'upload error text');

            // returned to normal button
            buttons = findAll('[data-test-button="upload-redirects"]');
            assert.strictEqual(buttons.length, 1, 'no of post-failure buttons');
            assert.dom(buttons[0]).doesNotHaveClass('gh-btn-red', 'post-failure button doesn\'t have failure class');
            assert.dom(buttons[0]).containsText('Upload redirects', 'post-failure button text');

            // successful upload clears error
            this.server.post('/redirects/upload/', {}, 200);
            await fileUpload(
                '[data-test-file-input="redirects"] input',
                ['test'],
                {name: 'redirects-bad.json', type: 'application/json'}
            );

            assert.dom('[data-test-error="redirects"]').doesNotExist();

            // can download redirects.json
            await click('[data-test-link="download-redirects"]');

            let iframe = document.querySelector('#iframeDownload');
            assert.dom(iframe).hasAttribute('src', '/redirects/download/');
        });

        test('can upload/download routes.yaml', async function (assert) {
            await visit('/settings/labs');

            // successful upload
            this.server.post('/settings/routes/yaml/', {}, 200);

            await fileUpload(
                '[data-test-file-input="routes"] input',
                ['test'],
                {name: 'routes.yaml', type: 'application/x-yaml'}
            );

            // TODO: tests for the temporary success/failure state have been
            // disabled because they were randomly failing

            // this should be half-way through button reset timeout
            // await timeout(50);
            //
            // // shows success button
            // let button = find('[data-test-button="upload-routes"]');
            // expect(button.length, 'no of success buttons').to.equal(1);
            // expect(
            //     button.hasClass('gh-btn-green'),
            //     'success button is green'
            // ).to.be.true;
            // expect(
            //     button.text().trim(),
            //     'success button text'
            // ).to.have.string('Uploaded');
            //
            // await wait();

            // returned to normal button
            let buttons = findAll('[data-test-button="upload-routes"]');
            assert.strictEqual(buttons.length, 1, 'no of post-success buttons');
            assert.dom(buttons[0]).doesNotHaveClass('gh-btn-green', 'routes post-success button doesn\'t have success class');
            assert.dom(buttons[0]).containsText('Upload routes YAML', 'routes post-success button text');

            // failed upload
            this.server.post('/settings/routes/yaml/', {
                errors: [{
                    type: 'BadRequestError',
                    message: 'Test failure message'
                }]
            }, 400);

            await fileUpload(
                '[data-test-file-input="routes"] input',
                ['test'],
                {name: 'routes-bad.yaml', type: 'application/x-yaml'}
            );

            // TODO: tests for the temporary success/failure state have been
            // disabled because they were randomly failing

            // this should be half-way through button reset timeout
            // await timeout(50);
            //
            // shows failure button
            // button = find('[data-test-button="upload-routes"]');
            // expect(button.length, 'no of failure buttons').to.equal(1);
            // expect(
            //     button.hasClass('gh-btn-red'),
            //     'failure button is red'
            // ).to.be.true;
            // expect(
            //     button.text().trim(),
            //     'failure button text'
            // ).to.have.string('Upload Failed');
            //
            // await wait();

            // shows error message
            assert.dom('[data-test-error="routes"]').containsText('Test failure message', 'routes upload error text');

            // returned to normal button
            buttons = findAll('[data-test-button="upload-routes"]');
            assert.strictEqual(buttons.length, 1, 'no of post-failure buttons');
            assert.dom(buttons[0]).doesNotHaveClass('gh-btn-red', 'routes post-failure button doesn\'t have failure class');
            assert.dom(buttons[0]).containsText('Upload routes YAML', 'routes post-failure button text');

            // successful upload clears error
            this.server.post('/settings/routes/yaml/', {}, 200);
            await fileUpload(
                '[data-test-file-input="routes"] input',
                ['test'],
                {name: 'routes-good.yaml', type: 'application/x-yaml'}
            );

            assert.dom('[data-test-error="routes"]').doesNotExist();

            // can download redirects.json
            await click('[data-test-link="download-routes"]');

            let iframe = document.querySelector('#iframeDownload');
            assert.dom(iframe).hasAttribute('src', '/settings/routes/yaml/');
        });
    });

    module('When logged in as Owner', function (hooks) {
        hooks.beforeEach(async function () {
            let role = this.server.create('role', {name: 'Owner'});
            this.server.create('user', {roles: [role]});

            return await authenticateSession();
        });

        test.skip('sets the mailgunBaseUrl to the default', async function (assert) {
            await visit('/settings/members');

            await fillIn('[data-test-mailgun-api-key-input]', 'i_am_an_api_key');
            await fillIn('[data-test-mailgun-domain-input]', 'https://domain.tld');

            await click('[data-test-button="save-members-settings"]');

            let [lastRequest] = this.server.pretender.handledRequests.slice(-1);
            let params = JSON.parse(lastRequest.requestBody);

            assert.notEqual(params.settings.findBy('key', 'mailgun_base_url').value, null);
        });
    });
});
