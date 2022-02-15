import Service from '@ember/service';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import sinon from 'sinon';
import {beforeEach, module, test} from 'qunit';
import {setupTest} from 'ember-qunit';

const mockAjax = Service.extend({
    skipSessionDeletion: false,
    init() {
        this._super(...arguments);
        this.post = sinon.stub().resolves();
        this.del = sinon.stub().resolves();
    }
});

const mockConfig = Service.extend({
    init() {
        this._super(...arguments);
        this.fetchAuthenticated = sinon.stub().resolves();
    }
});

const mockFeature = Service.extend({
    init() {
        this._super(...arguments);
        this.fetch = sinon.stub().resolves();
    }
});

const mockSettings = Service.extend({
    init() {
        this._super(...arguments);
        this.fetch = sinon.stub().resolves();
    }
});

const mockGhostPaths = Service.extend({
    apiRoot: ghostPaths().apiRoot
});

module('Unit: Authenticator: cookie', () => {
    setupTest();

    beforeEach(function () {
        this.owner.register('service:ajax', mockAjax);
        this.owner.register('service:config', mockConfig);
        this.owner.register('service:feature', mockFeature);
        this.owner.register('service:settings', mockSettings);
        this.owner.register('service:ghost-paths', mockGhostPaths);
    });

    module('#restore', function () {
        test('returns a resolving promise', function () {
            return this.owner.lookup('authenticator:cookie').restore();
        });
    });

    module('#authenticate', function () {
        test('posts the username and password to the sessionEndpoint and returns the promise', function (assert) {
            let authenticator = this.owner.lookup('authenticator:cookie');
            let post = authenticator.ajax.post;

            return authenticator.authenticate('AzureDiamond', 'hunter2').then(() => {
                assert.strictEqual(post.args[0][0], `${ghostPaths().apiRoot}/session`);
                assert.includes(post.args[0][1], {
                    data: {
                        username: 'AzureDiamond',
                        password: 'hunter2'
                    }
                });
                assert.includes(post.args[0][1], {
                    dataType: 'text'
                });
                assert.includes(post.args[0][1], {
                    contentType: 'application/json;charset=utf-8'
                });
            });
        });
    });

    module('#invalidate', function () {
        test('makes a delete request to the sessionEndpoint', function (assert) {
            let authenticator = this.owner.lookup('authenticator:cookie');
            let del = authenticator.ajax.del;

            return authenticator.invalidate().then(() => {
                assert.strictEqual(del.args[0][0], `${ghostPaths().apiRoot}/session`);
            });
        });
    });
});
