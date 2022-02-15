import $ from 'jquery';
import Pretender from 'pretender';
import Service from '@ember/service';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {UnsupportedMediaTypeError} from 'ghost-admin/services/ajax';
import {click, find, findAll, render, settled, triggerEvent} from '@ember/test-helpers';
import {createFile, fileUpload} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {setupRenderingTest} from 'ember-qunit';

const notificationsStub = Service.extend({
    showAPIError(/* error, options */) {
        // noop - to be stubbed
    }
});

const sessionStub = Service.extend({
    isAuthenticated: false,

    init() {
        this._super(...arguments);
        let authenticated = {access_token: 'AccessMe123'};
        this.authenticated = authenticated;
        this.data = {authenticated};
    }
});

const stubSuccessfulUpload = function (server, delay = 0) {
    server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
        return [200, {'Content-Type': 'application/json'}, '{"images": [{"url":"/content/images/test.png"}]}'];
    }, delay);
};

const stubFailedUpload = function (server, code, error, delay = 0) {
    server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
        return [code, {'Content-Type': 'application/json'}, JSON.stringify({
            errors: [{
                type: error,
                message: `Error: ${error}`
            }]
        })];
    }, delay);
};

module('Integration: Component: gh-image-uploader', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    beforeEach(function () {
        this.owner.register('service:session', sessionStub);
        this.owner.register('service:notifications', notificationsStub);
        this.set('update', function () {});
        server = new Pretender();
    });

    afterEach(function () {
        server.shutdown();
    });

    test('renders form with supplied alt text', async function (assert) {
        await render(hbs`{{gh-image-uploader image=image altText="text test"}}`);
        assert.dom('[data-test-file-input-description]').hasText('Upload image of "text test"');
    });

    test('renders form with supplied text', async function (assert) {
        await render(hbs`{{gh-image-uploader image=image text="text test"}}`);
        assert.dom('[data-test-file-input-description]').hasText('text test');
    });

    test('generates request to correct endpoint', async function (assert) {
        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(server.handledRequests.length, 1);
        assert.strictEqual(server.handledRequests[0].url, `${ghostPaths().apiRoot}/images/upload/`);
        assert.notOk(server.handledRequests[0].requestHeaders.Authorization);
    });

    test('fires update action on successful upload', async function (assert) {
        let update = sinon.spy();
        this.set('update', update);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(update.calledOnce);
        assert.strictEqual(update.firstCall.args[0], '/content/images/test.png');
    });

    test('doesn\'t fire update action on failed upload', async function (assert) {
        let update = sinon.spy();
        this.set('update', update);

        stubFailedUpload(server, 500);

        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.false(update.calledOnce);
    });

    test('fires fileSelected action on file selection', async function (assert) {
        let fileSelected = sinon.spy();
        this.set('fileSelected', fileSelected);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image fileSelected=(action fileSelected) update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(fileSelected.calledOnce);
        assert.ok(fileSelected.args[0]);
    });

    test('fires uploadStarted action on upload start', async function (assert) {
        let uploadStarted = sinon.spy();
        this.set('uploadStarted', uploadStarted);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image uploadStarted=(action uploadStarted) update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(uploadStarted.calledOnce);
    });

    test('fires uploadFinished action on successful upload', async function (assert) {
        let uploadFinished = sinon.spy();
        this.set('uploadFinished', uploadFinished);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image uploadFinished=(action uploadFinished) update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(uploadFinished.calledOnce);
    });

    test('fires uploadFinished action on failed upload', async function (assert) {
        let uploadFinished = sinon.spy();
        this.set('uploadFinished', uploadFinished);

        stubFailedUpload(server);

        await render(hbs`{{gh-image-uploader image=image uploadFinished=(action uploadFinished) update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(uploadFinished.calledOnce);
    });

    test('displays invalid file type error', async function (assert) {
        stubFailedUpload(server, 415, 'UnsupportedMediaTypeError');
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The image type you uploaded is not supported/);
        assert.strictEqual(findAll('.gh-btn-green').length, 1, 'reset button is displayed');
        assert.strictEqual(find('.gh-btn-green').textContent, 'Try Again');
    });

    test('displays file too large for server error', async function (assert) {
        stubFailedUpload(server, 413, 'RequestEntityTooLargeError');
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The image you uploaded was larger/);
    });

    test('handles file too large error directly from the web server', async function (assert) {
        server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
            return [413, {}, ''];
        });
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The image you uploaded was larger/);
    });

    test('displays other server-side error with message', async function (assert) {
        stubFailedUpload(server, 400, 'UnknownError');
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /Error: UnknownError/);
    });

    test('handles unknown failure', async function (assert) {
        server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
            return [500, {'Content-Type': 'application/json'}, ''];
        });
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /Something went wrong/);
    });

    test('triggers notifications.showAPIError for VersionMismatchError', async function (assert) {
        let showAPIError = sinon.spy();
        let notifications = this.owner.lookup('service:notifications');
        notifications.set('showAPIError', showAPIError);

        stubFailedUpload(server, 400, 'VersionMismatchError');

        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(showAPIError.calledOnce);
    });

    test('doesn\'t trigger notifications.showAPIError for other errors', async function (assert) {
        let showAPIError = sinon.spy();
        let notifications = this.owner.lookup('service:notifications');
        notifications.set('showAPIError', showAPIError);

        stubFailedUpload(server, 400, 'UnknownError');
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.false(showAPIError.called);
    });

    test('can be reset after a failed upload', async function (assert) {
        stubFailedUpload(server, 400, 'UnknownError');
        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);
        await fileUpload('input[type="file"]', ['test'], {type: 'test.png'});
        await click('.gh-btn-green');

        assert.strictEqual(findAll('input[type="file"]').length, 1);
    });

    test('handles drag over/leave', async function (assert) {
        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader image=image update=(action update)}}`);

        run(() => {
            // eslint-disable-next-line new-cap
            let dragover = $.Event('dragover', {
                dataTransfer: {
                    files: []
                }
            });
            $(find('.gh-image-uploader')).trigger(dragover);
        });
        await settled();

        assert.true(find('.gh-image-uploader').classList.contains('-drag-over'), 'has drag-over class');

        await triggerEvent('.gh-image-uploader', 'dragleave');

        assert.false(find('.gh-image-uploader').classList.contains('-drag-over'), 'has drag-over class');
    });

    test('triggers file upload on file drop', async function (assert) {
        let uploadSuccess = sinon.spy();
        // eslint-disable-next-line new-cap
        let drop = $.Event('drop', {
            dataTransfer: {
                files: [createFile(['test'], {name: 'test.png'})]
            }
        });

        this.set('uploadSuccess', uploadSuccess);

        stubSuccessfulUpload(server);
        await render(hbs`{{gh-image-uploader uploadSuccess=(action uploadSuccess)}}`);

        run(() => {
            $(find('.gh-image-uploader')).trigger(drop);
        });
        await settled();

        assert.true(uploadSuccess.calledOnce);
        assert.strictEqual(uploadSuccess.firstCall.args[0], '/content/images/test.png');
    });

    test('validates extension by default', async function (assert) {
        let uploadSuccess = sinon.spy();
        let uploadFailed = sinon.spy();

        this.set('uploadSuccess', uploadSuccess);
        this.set('uploadFailed', uploadFailed);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader
            uploadSuccess=(action uploadSuccess)
            uploadFailed=(action uploadFailed)}}`);

        await fileUpload('input[type="file"]', ['test'], {name: 'test.json'});

        assert.false(uploadSuccess.called);
        assert.true(uploadFailed.calledOnce);
        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The image type you uploaded is not supported/);
    });

    test('uploads if validate action supplied and returns true', async function (assert) {
        let validate = sinon.stub().returns(true);
        let uploadSuccess = sinon.spy();

        this.set('validate', validate);
        this.set('uploadSuccess', uploadSuccess);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader
            uploadSuccess=(action uploadSuccess)
            validate=(action validate)}}`);

        await fileUpload('input[type="file"]', ['test'], {name: 'test.txt'});

        assert.true(validate.calledOnce);
        assert.true(uploadSuccess.calledOnce);
    });

    test('skips upload and displays error if validate action supplied and doesn\'t return true', async function (assert) {
        let validate = sinon.stub().returns(new UnsupportedMediaTypeError());
        let uploadSuccess = sinon.spy();
        let uploadFailed = sinon.spy();

        this.set('validate', validate);
        this.set('uploadSuccess', uploadSuccess);
        this.set('uploadFailed', uploadFailed);

        stubSuccessfulUpload(server);

        await render(hbs`{{gh-image-uploader
            uploadSuccess=(action uploadSuccess)
            uploadFailed=(action uploadFailed)
            validate=(action validate)}}`);

        await fileUpload('input[type="file"]', ['test'], {name: 'test.png'});

        assert.true(validate.calledOnce);
        assert.false(uploadSuccess.called);
        assert.true(uploadFailed.calledOnce);
        assert.strictEqual(findAll('.failed').length, 1, 'error message is displayed');
        assert.match(find('.failed').textContent, /The image type you uploaded is not supported/);
    });

    module('unsplash', function () {
        test('has unsplash icon only when unsplash is active & allowed');
        test('opens unsplash modal when icon clicked');
        test('inserts unsplash image when selected');
        test('closes unsplash modal when close is triggered');
    });
});
