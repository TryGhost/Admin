import Pretender from 'pretender';
import Service from '@ember/service';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, find, findAll, render, waitFor} from '@ember/test-helpers';
import {fileUpload} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

const notificationsStub = Service.extend({
    showAPIError() {
        // noop - to be stubbed
    }
});

const stubSuccessfulUpload = function (server, delay = 0) {
    server.post(`${ghostPaths().apiRoot}/members/upload/`, function () {
        return [200, {'Content-Type': 'application/json'}, '{"url":"/content/images/test.png"}'];
    }, delay);
};

const stubFailedUpload = function (server, code, error, delay = 0) {
    server.post(`${ghostPaths().apiRoot}/members/upload/`, function () {
        return [code, {'Content-Type': 'application/json'}, JSON.stringify({
            errors: [{
                type: error,
                message: `Error: ${error}`
            }]
        })];
    }, delay);
};

module('Integration: Component: modal-import-members-test', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
        this.set('uploadUrl', `${ghostPaths().apiRoot}/members/upload/`);

        this.owner.register('service:notifications', notificationsStub);
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('renders', async function (assert) {
        await render(hbs`{{modal-import-members}}`);

        assert.strictEqual(find('h1').textContent.trim(), 'Import members', 'default header');
        assert.strictEqual(find('.description').textContent.trim(), 'Select or drop a CSV file', 'upload label');
    });

    test('generates request to supplied endpoint', async function (assert) {
        stubSuccessfulUpload(server);

        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        await waitFor('table', {timeout: 50});

        assert.strictEqual(find('label').textContent.trim(), 'Label these members', 'labels label');
        assert.match(find('.gh-btn-green').textContent, /Import/g);

        await click('.gh-btn-green');

        assert.strictEqual(server.handledRequests.length, 1);
        assert.strictEqual(server.handledRequests[0].url, `${ghostPaths().apiRoot}/members/upload/`);
    });

    test('displays server error', async function (assert) {
        stubFailedUpload(server, 415, 'UnsupportedMediaTypeError');
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The file type you uploaded is not supported/);
    });

    test('displays file too large for server error', async function (assert) {
        stubFailedUpload(server, 413, 'RequestEntityTooLargeError');
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The file you uploaded was larger/);
    });

    test('handles file too large error directly from the web server', async function (assert) {
        server.post(`${ghostPaths().apiRoot}/members/upload/`, function () {
            return [413, {}, ''];
        });
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The file you uploaded was larger/);
    });

    test('displays other server-side error with message', async function (assert) {
        stubFailedUpload(server, 400, 'UnknownError');
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /Error: UnknownError/);
    });

    test('handles unknown failure', async function (assert) {
        server.post(`${ghostPaths().apiRoot}/members/upload/`, function () {
            return [500, {'Content-Type': 'application/json'}, ''];
        });
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /Something went wrong/);
    });

    test('triggers notifications.showAPIError for VersionMismatchError', async function (assert) {
        let showAPIError = sinon.spy();
        let notifications = this.owner.lookup('service:notifications');
        notifications.set('showAPIError', showAPIError);

        stubFailedUpload(server, 400, 'VersionMismatchError');

        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.true(showAPIError.calledOnce);
    });

    test('doesn\'t trigger notifications.showAPIError for other errors', async function (assert) {
        let showAPIError = sinon.spy();
        let notifications = this.owner.lookup('service:notifications');
        notifications.set('showAPIError', showAPIError);

        stubFailedUpload(server, 400, 'UnknownError');
        await render(hbs`{{modal-import-members}}`);
        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.false(showAPIError.called);
    });

    test('validates extension by default', async function (assert) {
        stubFailedUpload(server, 415);

        await render(hbs`{{modal-import-members}}`);

        await fileUpload('input[type="file"]', ['name,email\r\nmembername,memberemail@example.com'], {name: 'test.csv'});

        // Wait for async CSV parsing to finish
        await waitFor('table', {timeout: 50});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The file type you uploaded is not supported/);
    });
});
