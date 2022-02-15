import Pretender from 'pretender';
import config from 'ghost-admin/config/environment';
import {expect} from 'chai';
import {
    isAjaxError,
    isUnauthorizedError
} from 'ember-ajax/errors';
import {
    isMaintenanceError,
    isRequestEntityTooLargeError,
    isUnsupportedMediaTypeError,
    isVersionMismatchError
} from 'ghost-admin/services/ajax';
import {module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

function stubAjaxEndpoint(server, response = {}, code = 200) {
    server.get('/test/', function () {
        return [
            code,
            {'Content-Type': 'application/json'},
            JSON.stringify(response)
        ];
    });
}

module('Integration: Service: ajax', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('adds Ghost version header to requests', function (assert) {
        let {version} = config.APP;
        let ajax = this.owner.lookup('service:ajax');

        stubAjaxEndpoint(server, {});

        ajax.request('/test/').then(() => {
            let [request] = server.handledRequests;
            assert.strictEqual(request.requestHeaders['X-Ghost-Version'], version);
        });
    });

    test('correctly parses single message response text', function (assert) {
        let errorResponse = {message: 'Test Error'};
        stubAjaxEndpoint(server, errorResponse, 500);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            expect(false).to.be.true();
        }).catch((error) => {
            assert.strictEqual(error.payload.errors.length, 1);
            assert.strictEqual(error.payload.errors[0].message, 'Test Error');
        });
    });

    test('correctly parses single error response text', function (assert) {
        let errorResponse = {error: 'Test Error'};
        stubAjaxEndpoint(server, errorResponse, 500);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            expect(false).to.be.true();
        }).catch((error) => {
            assert.strictEqual(error.payload.errors.length, 1);
            assert.strictEqual(error.payload.errors[0].message, 'Test Error');
        });
    });

    test('correctly parses multiple error messages', function (assert) {
        let errorResponse = {errors: ['First Error', 'Second Error']};
        stubAjaxEndpoint(server, errorResponse, 500);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            expect(false).to.be.true();
        }).catch((error) => {
            assert.strictEqual(error.payload.errors.length, 2);
            assert.strictEqual(error.payload.errors[0].message, 'First Error');
            assert.strictEqual(error.payload.errors[1].message, 'Second Error');
        });
    });

    test('returns default error object for non built-in error', function (assert) {
        stubAjaxEndpoint(server, {}, 500);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isAjaxError(error));
        });
    });

    test('handles error checking for built-in errors', function (assert) {
        stubAjaxEndpoint(server, '', 401);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isUnauthorizedError(error));
        });
    });

    test('handles error checking for VersionMismatchError', function (assert) {
        server.get('/test/', function () {
            return [
                400,
                {'Content-Type': 'application/json'},
                JSON.stringify({
                    errors: [{
                        type: 'VersionMismatchError',
                        statusCode: 400
                    }]
                })
            ];
        });

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isVersionMismatchError(error));
        });
    });

    test('handles error checking for RequestEntityTooLargeError on 413 errors', function (assert) {
        stubAjaxEndpoint(server, {}, 413);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isRequestEntityTooLargeError(error));
        });
    });

    test('handles error checking for UnsupportedMediaTypeError on 415 errors', function (assert) {
        stubAjaxEndpoint(server, {}, 415);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isUnsupportedMediaTypeError(error));
        });
    });

    test('handles error checking for MaintenanceError on 503 errors', function (assert) {
        stubAjaxEndpoint(server, {}, 503);

        let ajax = this.owner.lookup('service:ajax');

        ajax.request('/test/').then(() => {
            assert.false(true);
        }).catch((error) => {
            assert.true(isMaintenanceError(error));
        });
    });
});
