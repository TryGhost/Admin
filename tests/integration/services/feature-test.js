import EmberError from '@ember/error';
import FeatureService, {feature} from 'ghost-admin/services/feature';
import Pretender from 'pretender';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {expect} from 'chai';
import {module, test} from 'qunit';
import {run} from '@ember/runloop';
import {settled} from '@ember/test-helpers';
import {setupTest} from 'ember-qunit';

function stubSettings(server, labs, validSave = true) {
    let settings = [
        {
            id: '1',
            type: 'labs',
            key: 'labs',
            value: JSON.stringify(labs)
        }
    ];

    server.get(`${ghostPaths().apiRoot}/settings/`, function () {
        return [200, {'Content-Type': 'application/json'}, JSON.stringify({settings})];
    });

    server.put(`${ghostPaths().apiRoot}/settings/`, function (request) {
        let statusCode = (validSave) ? 200 : 400;
        let response = (validSave) ? request.requestBody : JSON.stringify({
            errors: [{
                message: 'Test Error'
            }]
        });

        return [statusCode, {'Content-Type': 'application/json'}, response];
    });
}

function stubUser(server, accessibility, validSave = true) {
    let users = [{
        id: '1',
        // Add extra properties for the validations
        name: 'Test User',
        email: 'test@example.com',
        accessibility: JSON.stringify(accessibility),
        roles: [{
            id: 1,
            name: 'Owner',
            description: 'Owner'
        }]
    }];

    server.get(`${ghostPaths().apiRoot}/users/me/`, function () {
        return [200, {'Content-Type': 'application/json'}, JSON.stringify({users})];
    });

    server.put(`${ghostPaths().apiRoot}/users/1/`, function (request) {
        let statusCode = (validSave) ? 200 : 400;
        let response = (validSave) ? request.requestBody : JSON.stringify({
            errors: [{
                message: 'Test Error'
            }]
        });

        return [statusCode, {'Content-Type': 'application/json'}, response];
    });
}

function addTestFlag() {
    FeatureService.reopen({
        testFlag: feature('testFlag'),
        testUserFlag: feature('testUserFlag', {user: true})
    });
}

module('Integration: Service: feature', function (hooks) {
    setupTest(hooks);

    let server;

    hooks.beforeEach(function () {
        server = new Pretender();
    });

    hooks.afterEach(function () {
        server.shutdown();
    });

    test('loads labs and user settings correctly', async function (assert) {
        stubSettings(server, {testFlag: true});
        stubUser(server, {testUserFlag: true});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');

        return service.fetch().then(() => {
            assert.true(service.get('testFlag'));
            assert.true(service.get('testUserFlag'));
        });
    });

    test('returns false for set flag with config false and labs false', async function (assert) {
        stubSettings(server, {testFlag: false});
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', false);

        return service.fetch().then(() => {
            assert.false(service.get('labs.testFlag'));
            assert.false(service.get('testFlag'));
        });
    });

    test('returns true for set flag with config true and labs false', async function (assert) {
        stubSettings(server, {testFlag: false});
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', true);

        return service.fetch().then(() => {
            assert.false(service.get('labs.testFlag'));
            assert.true(service.get('testFlag'));
        });
    });

    test('returns true for set flag with config false and labs true', async function (assert) {
        stubSettings(server, {testFlag: true});
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', false);

        return service.fetch().then(() => {
            assert.true(service.get('labs.testFlag'));
            assert.true(service.get('testFlag'));
        });
    });

    test('returns true for set flag with config true and labs true', async function (assert) {
        stubSettings(server, {testFlag: true});
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', true);

        return service.fetch().then(() => {
            assert.true(service.get('labs.testFlag'));
            assert.true(service.get('testFlag'));
        });
    });

    test('returns false for set flag with accessibility false', async function (assert) {
        stubSettings(server, {});
        stubUser(server, {testUserFlag: false});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');

        return service.fetch().then(() => {
            assert.false(service.get('accessibility.testUserFlag'));
            assert.false(service.get('testUserFlag'));
        });
    });

    test('returns true for set flag with accessibility true', async function (assert) {
        stubSettings(server, {});
        stubUser(server, {testUserFlag: true});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');

        return service.fetch().then(() => {
            assert.true(service.get('accessibility.testUserFlag'));
            assert.true(service.get('testUserFlag'));
        });
    });

    test('saves labs setting correctly', async function (assert) {
        stubSettings(server, {testFlag: false});
        stubUser(server, {testUserFlag: false});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', false);

        return service.fetch().then(() => {
            assert.false(service.get('testFlag'));

            run(() => {
                service.set('testFlag', true);
            });

            return settled().then(() => {
                assert.strictEqual(server.handlers[1].numberOfCalls, 1);
                assert.true(service.get('testFlag'));
            });
        });
    });

    test('saves accessibility setting correctly', async function (assert) {
        stubSettings(server, {});
        stubUser(server, {testUserFlag: false});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');

        return service.fetch().then(() => {
            assert.false(service.get('testUserFlag'));

            run(() => {
                service.set('testUserFlag', true);
            });

            return settled().then(() => {
                assert.strictEqual(server.handlers[3].numberOfCalls, 1);
                assert.true(service.get('testUserFlag'));
            });
        });
    });

    test('notifies for server errors on labs save', async function (assert) {
        stubSettings(server, {testFlag: false}, false);
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', false);

        return service.fetch().then(() => {
            assert.false(service.get('testFlag'));

            run(() => {
                service.set('testFlag', true);
            });

            return settled().then(() => {
                assert.strictEqual(server.handlers[1].numberOfCalls, 1, 'PUT call is made');

                assert.strictEqual(service.get('notifications.alerts').length, 1, 'number of alerts shown');

                assert.false(service.get('testFlag'));
            });
        });
    });

    test('notifies for server errors on accessibility save', async function (assert) {
        stubSettings(server, {});
        stubUser(server, {testUserFlag: false}, false);

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');

        return service.fetch().then(() => {
            assert.false(service.get('testUserFlag'));

            run(() => {
                service.set('testUserFlag', true);
            });

            return settled().then(() => {
                assert.strictEqual(server.handlers[3].numberOfCalls, 1, 'PUT call is made');

                assert.strictEqual(service.get('notifications.alerts').length, 1, 'number of alerts shown');

                assert.false(service.get('testUserFlag'));
            });
        });
    });

    test('notifies for validation errors', async function (assert) {
        stubSettings(server, {testFlag: false}, true, false);
        stubUser(server, {});

        addTestFlag();

        let session = this.owner.lookup('service:session');
        await session.populateUser();

        let service = this.owner.lookup('service:feature');
        service.get('config').set('testFlag', false);

        return service.fetch().then(() => {
            assert.false(service.get('testFlag'));

            run(() => {
                expect(() => {
                    service.set('testFlag', true);
                }, EmberError, 'threw validation error');
            });

            return settled().then(() => {
                // ensure validation is happening before the API is hit
                assert.strictEqual(server.handlers[1].numberOfCalls, 0);
                assert.false(service.get('testFlag'));
            });
        });
    });
});
