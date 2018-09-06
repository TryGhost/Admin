import CookieAuthenticator from 'ghost-admin/authenticators/cookie';
import sinon from 'sinon';
import {beforeEach, describe, it} from 'mocha';
import {expect} from 'chai';

describe('BaseAuthenticator', () => {
    let authenticator;
    let fakeSessionEndpoint;
    let fakeAjaxService;
    let sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
        fakeSessionEndpoint = 'http://host.tld/api/v2/admin/session';
    });

    beforeEach(function () {
        sandbox.restore();
        authenticator = CookieAuthenticator.create();
        fakeAjaxService = {
            post: sandbox.stub().resolves(),
            del: sandbox.stub().resolves()
        };
        sandbox.stub(authenticator, 'get')
            .withArgs('sessionEndpoint')
            .returns(fakeSessionEndpoint)
            .withArgs('ajax')
            .returns(fakeAjaxService);
    });

    describe('#restore', function () {
        it('returns a resolving promise', function () {
            return authenticator.restore();
        });
    });

    describe('#authenticate', function () {
        it('posts the username and password to the sessionEndpoint and returns the promise', function () {
            return authenticator.authenticate('AzureDiamond', 'hunter2').then(() => {
                expect(fakeAjaxService.post.args[0][0]).to.equal(fakeSessionEndpoint);
                expect(fakeAjaxService.post.args[0][1]).to.deep.include({
                    data: {
                        username: 'AzureDiamond',
                        password: 'hunter2'
                    }
                });
                expect(fakeAjaxService.post.args[0][1]).to.deep.include({
                    dataType: 'text'
                });
                expect(fakeAjaxService.post.args[0][1]).to.deep.include({
                    contentType: 'application/json;charset=utf-8'
                });
            });
        });
    });

    describe('#invalidate', function () {
        it('makes a delete request to the sessionEndpoint', function () {
            return authenticator.invalidate().then(() => {
                expect(fakeAjaxService.del.args[0][0]).to.equal(fakeSessionEndpoint);
            });
        });
    });
});
