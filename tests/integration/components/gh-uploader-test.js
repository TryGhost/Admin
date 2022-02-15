import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import {click, find, findAll, render, settled, waitFor, waitUntil} from '@ember/test-helpers';
import {createFile} from '../../helpers/file-upload';
import {module, test} from 'qunit';
import {setupRenderingTest} from 'ember-qunit';

const stubSuccessfulUpload = function (server, delay = 0) {
    server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
        return [200, {'Content-Type': 'application/json'}, '{"images": [{"url": "/content/images/test.png"}]}'];
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

module('Integration: Component: gh-uploader', function (hooks) {
    setupRenderingTest(hooks);

    let server;

    beforeEach(function () {
        server = new Pretender();
    });

    afterEach(function () {
        server.shutdown();
    });

    module('uploads', function (hooks) {
        hooks.beforeEach(function () {
            stubSuccessfulUpload(server);
        });

        test('triggers uploads when `files` is set', async function (assert) {
            await render(hbs`{{#gh-uploader files=files}}{{/gh-uploader}}`);

            this.set('files', [createFile()]);
            await settled();

            let [lastRequest] = server.handledRequests;
            assert.strictEqual(server.handledRequests.length, 1);
            assert.strictEqual(lastRequest.url, `${ghostPaths().apiRoot}/images/upload/`);
            // requestBody is a FormData object
            // this will fail in anything other than Chrome and Firefox
            // https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility
            assert.true(lastRequest.requestBody.has('file'));
        });

        test('triggers multiple uploads', async function (assert) {
            await render(hbs`{{#gh-uploader files=files}}{{/gh-uploader}}`);

            this.set('files', [createFile(), createFile()]);
            await settled();

            assert.strictEqual(server.handledRequests.length, 2);
        });

        test('triggers onStart when upload starts', async function (assert) {
            this.set('uploadStarted', sinon.spy());

            await render(hbs`{{#gh-uploader files=files onStart=(action uploadStarted)}}{{/gh-uploader}}`);
            this.set('files', [createFile(), createFile()]);
            await settled();

            assert.true(this.uploadStarted.calledOnce);
        });

        test('triggers onUploadSuccess when a file uploads', async function (assert) {
            this.set('fileUploaded', sinon.spy());

            await render(hbs`{{#gh-uploader files=files onUploadSuccess=(action fileUploaded)}}{{/gh-uploader}}`);
            this.set('files', [createFile(['test'], {name: 'file1.png'}), createFile()]);
            await settled();

            // triggered for each file
            assert.true(this.fileUploaded.calledTwice);

            // filename and url is passed in arg
            let firstCall = this.fileUploaded.getCall(0);
            assert.strictEqual(firstCall.args[0].fileName, 'file1.png');
            assert.strictEqual(firstCall.args[0].url, '/content/images/test.png');
        });

        test('triggers onComplete when all files uploaded', async function (assert) {
            this.set('uploadsFinished', sinon.spy());

            await render(hbs`{{#gh-uploader files=files onComplete=(action uploadsFinished)}}{{/gh-uploader}}`);
            this.set('files', [
                createFile(['test'], {name: 'file1.png'}),
                createFile(['test'], {name: 'file2.png'})
            ]);
            await settled();

            assert.true(this.uploadsFinished.calledOnce);

            // array of filenames and urls is passed in arg
            let [result] = this.uploadsFinished.getCall(0).args;
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].fileName, 'file1.png');
            assert.strictEqual(result[0].url, '/content/images/test.png');
            assert.strictEqual(result[1].fileName, 'file2.png');
            assert.strictEqual(result[1].url, '/content/images/test.png');
        });

        test('onComplete only passes results for last upload', async function (assert) {
            this.set('uploadsFinished', sinon.spy());

            await render(hbs`{{#gh-uploader files=files onComplete=(action uploadsFinished)}}{{/gh-uploader}}`);
            this.set('files', [
                createFile(['test'], {name: 'file1.png'})
            ]);
            await settled();

            this.set('files', [
                createFile(['test'], {name: 'file2.png'})
            ]);

            await settled();

            let [results] = this.uploadsFinished.getCall(1).args;
            assert.strictEqual(results.length, 1);
            assert.strictEqual(results[0].fileName, 'file2.png');
        });

        test('onComplete returns results in same order as selected', async function (assert) {
            // first request has a delay to simulate larger file
            server.post(`${ghostPaths().apiRoot}/images/upload/`, function () {
                // second request has no delay to simulate small file
                stubSuccessfulUpload(server, 0);

                return [200, {'Content-Type': 'application/json'}, '"/content/images/test.png"'];
            }, 100);

            this.set('uploadsFinished', sinon.spy());

            await render(hbs`{{#gh-uploader files=files onComplete=(action uploadsFinished)}}{{/gh-uploader}}`);
            this.set('files', [
                createFile(['test'], {name: 'file1.png'}), // large - finishes last
                createFile(['test'], {name: 'file2.png'}) // small - finishes first
            ]);
            await settled();

            let [results] = this.uploadsFinished.getCall(0).args;
            assert.strictEqual(results.length, 2);
            assert.strictEqual(results[0].fileName, 'file1.png');
        });

        test('doesn\'t allow new files to be set whilst uploading', async function (assert) {
            let errorSpy = sinon.spy(console, 'error');
            stubSuccessfulUpload(server, 100);

            await render(hbs`{{#gh-uploader files=files}}{{/gh-uploader}}`);
            this.set('files', [createFile()]);

            // logs error because upload is in progress
            this.set('files', [createFile()]);

            await settled();

            // runs ok because original upload has finished
            this.set('files', [createFile()]);

            await settled();

            assert.strictEqual(server.handledRequests.length, 2);
            assert.true(errorSpy.calledOnce);
            errorSpy.restore();
        });

        test('yields isUploading whilst upload is in progress', async function (assert) {
            stubSuccessfulUpload(server, 100);

            await render(hbs`
            {{#gh-uploader files=files as |uploader|}}
                {{#if uploader.isUploading}}
                    <div class="is-uploading-test"></div>
                {{/if}}
            {{/gh-uploader}}`);

            this.set('files', [createFile(), createFile()]);

            await waitFor('.is-uploading-test', {timeout: 150});
            await settled();

            assert.dom('.is-uploading-test').doesNotExist();
        });

        test('yields progressBar component with total upload progress', async function (assert) {
            stubSuccessfulUpload(server, 100);

            await render(hbs`
            {{#gh-uploader files=files as |uploader|}}
                {{uploader.progressBar}}
            {{/gh-uploader}}`);

            this.set('files', [createFile(), createFile()]);

            await waitFor('[data-test-progress-bar]', {timeout: 150});
            let progressBar = find('[data-test-progress-bar]');
            await waitUntil(() => {
                let width = parseInt(progressBar.style.width);
                return width > 50;
            }, {timeout: 150});
            await settled();

            let finalProgressWidth = parseInt(find('[data-test-progress-bar]').style.width);
            assert.strictEqual(finalProgressWidth, 100, 'final progress width');
        });

        test('yields files property', async function (assert) {
            await render(hbs`
            {{#gh-uploader files=files as |uploader|}}
                {{#each uploader.files as |file|}}
                    <div class="file">{{file.name}}</div>
                {{/each}}
            {{/gh-uploader}}`);

            this.set('files', [
                createFile(['test'], {name: 'file1.png'}),
                createFile(['test'], {name: 'file2.png'})
            ]);

            assert.strictEqual(findAll('.file')[0].textContent, 'file1.png');
            assert.strictEqual(findAll('.file')[1].textContent, 'file2.png');
        });

        test('can be cancelled', async function (assert) {
            stubSuccessfulUpload(server, 200);
            this.set('cancelled', sinon.spy());
            this.set('complete', sinon.spy());

            await render(hbs`
            {{#gh-uploader files=files onCancel=(action cancelled) as |uploader|}}
                {{#if uploader.isUploading}}
                    <button class="cancel-button" {{action uploader.cancel}}>Cancel</button>
                {{/if}}
            {{/gh-uploader}}`);

            this.set('files', [createFile()]);

            await waitFor('.cancel-button');
            await click('.cancel-button');

            assert.true(this.cancelled.calledOnce, 'onCancel triggered');
            assert.true(this.complete.notCalled, 'onComplete triggered');
        });

        test('uploads to supplied `uploadUrl`', async function (assert) {
            server.post(`${ghostPaths().apiRoot}/images/`, function () {
                return [200, {'Content-Type': 'application/json'}, '{"images": [{"url": "/content/images/test.png"}]'];
            });

            await render(hbs`{{#gh-uploader files=files uploadUrl="/images/"}}{{/gh-uploader}}`);
            this.set('files', [createFile()]);
            await settled();

            let [lastRequest] = server.handledRequests;
            assert.strictEqual(lastRequest.url, `${ghostPaths().apiRoot}/images/`);
        });

        test('passes supplied paramName in request', async function (assert) {
            await render(hbs`{{#gh-uploader files=files paramName="testupload"}}{{/gh-uploader}}`);
            this.set('files', [createFile()]);
            await settled();

            let [lastRequest] = server.handledRequests;
            // requestBody is a FormData object
            // this will fail in anything other than Chrome and Firefox
            // https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility
            assert.true(lastRequest.requestBody.has('testupload'));
        });
    });

    module('validation', function () {
        test('validates file extensions by default', async function (assert) {
            this.set('onFailed', sinon.spy());

            await render(hbs`
                {{#gh-uploader files=files extensions="jpg,jpeg" onFailed=(action onFailed)}}{{/gh-uploader}}
            `);
            this.set('files', [createFile(['test'], {name: 'test.png'})]);
            await settled();

            let [onFailedResult] = this.onFailed.firstCall.args;
            assert.strictEqual(onFailedResult.length, 1);
            assert.strictEqual(onFailedResult[0].fileName, 'test.png', 'onFailed file name');
            assert.match(onFailedResult[0].message, /not supported/, 'onFailed message');
        });

        test('accepts custom validation method', async function (assert) {
            this.set('validate', function (file) {
                return `${file.name} failed test validation`;
            });
            this.set('onFailed', sinon.spy());

            await render(hbs`
                {{#gh-uploader files=files validate=(action validate) onFailed=(action onFailed)}}{{/gh-uploader}}
            `);
            this.set('files', [createFile(['test'], {name: 'test.png'})]);
            await settled();

            let [onFailedResult] = this.onFailed.firstCall.args;
            assert.strictEqual(onFailedResult.length, 1);
            assert.strictEqual(onFailedResult[0].fileName, 'test.png');
            assert.strictEqual(onFailedResult[0].message, 'test.png failed test validation');
        });

        test('yields errors when validation fails', async function (assert) {
            await render(hbs`
                {{#gh-uploader files=files extensions="jpg,jpeg" as |uploader|}}
                    {{#each uploader.errors as |error|}}
                        <div class="error-fileName">{{error.fileName}}</div>
                        <div class="error-message">{{error.message}}</div>
                    {{/each}}
                {{/gh-uploader}}
            `);
            this.set('files', [createFile(['test'], {name: 'test.png'})]);
            await settled();

            assert.strictEqual(find('.error-fileName').textContent, 'test.png');
            assert.match(find('.error-message').textContent, /not supported/);
        });
    });

    module('server errors', function (hooks) {
        hooks.beforeEach(function () {
            stubFailedUpload(server, 500, 'No upload for you');
        });

        test('triggers onFailed when uploads complete', async function (assert) {
            this.set('uploadFailed', sinon.spy());
            this.set('uploadComplete', sinon.spy());

            await render(hbs`
                {{#gh-uploader
                    files=files
                    onFailed=(action uploadFailed)
                    onComplete=(action uploadComplete)}}
                {{/gh-uploader}}
            `);
            this.set('files', [
                createFile(['test'], {name: 'file1.png'}),
                createFile(['test'], {name: 'file2.png'})
            ]);
            await settled();

            assert.true(this.uploadFailed.calledOnce);
            assert.true(this.uploadComplete.calledOnce);

            let [failures] = this.uploadFailed.firstCall.args;
            assert.strictEqual(failures.length, 2);
            assert.strictEqual(failures[0].fileName, 'file1.png');
            assert.strictEqual(failures[0].message, 'Error: No upload for you');
        });

        test('triggers onUploadFailure when each upload fails', async function (assert) {
            this.set('uploadFail', sinon.spy());

            await render(hbs`
                {{#gh-uploader
                    files=files
                    onUploadFailure=(action uploadFail)}}
                {{/gh-uploader}}
            `);
            this.set('files', [
                createFile(['test'], {name: 'file1.png'}),
                createFile(['test'], {name: 'file2.png'})
            ]);
            await settled();

            assert.true(this.uploadFail.calledTwice);

            let [firstFailure] = this.uploadFail.firstCall.args;
            assert.strictEqual(firstFailure.fileName, 'file1.png');
            assert.strictEqual(firstFailure.message, 'Error: No upload for you');

            let [secondFailure] = this.uploadFail.secondCall.args;
            assert.strictEqual(secondFailure.fileName, 'file2.png');
            assert.strictEqual(secondFailure.message, 'Error: No upload for you');
        });

        test('yields errors when uploads fail', async function (assert) {
            await render(hbs`
                {{#gh-uploader files=files as |uploader|}}
                    {{#each uploader.errors as |error|}}
                        <div class="error-fileName">{{error.fileName}}</div>
                        <div class="error-message">{{error.message}}</div>
                    {{/each}}
                {{/gh-uploader}}
            `);
            this.set('files', [createFile(['test'], {name: 'test.png'})]);
            await settled();

            assert.strictEqual(find('.error-fileName').textContent, 'test.png');
            assert.strictEqual(find('.error-message').textContent, 'Error: No upload for you');
        });
    });
});
