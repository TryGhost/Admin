import Pretender from 'pretender';
import localeConfig from 'ember-i18n/config/en';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {run} from '@ember/runloop';
import {setupModelTest} from 'ember-mocha';

describe('Unit: Model: invite', function () {
    setupModelTest('invite', {
        needs: [
            'model:role',
            'serializer:application',
            'serializer:invite',
            'transform:moment-utc',
            'service:ghost-paths',
            'service:ajax',
            'service:session',
            'service:feature',
            'service:tour',
            'service:i18n',
            'locale:en/translations',
            'locale:en/config',
            'util:i18n/missing-message',
            'util:i18n/compile-template',
            'config:environment',
            'helper:t'
        ]
    });

    beforeEach(function () {
        getOwner(this).lookup('service:i18n').set('locale', 'en');
        this.register('locale:en/config', localeConfig);
    });

    describe('with network', function () {
        let server;

        beforeEach(function () {
            server = new Pretender();
        });

        afterEach(function () {
            server.shutdown();
        });

        it('resend hits correct endpoint', function () {
            let model = this.subject();
            let role;

            server.post('/ghost/api/v0.1/invites/', function () {
                return [200, {}, '{}'];
            });

            run(() => {
                role = this.store().push({data: {id: 1, type: 'role', attributes: {name: 'Editor'}}});
                model.set('email', 'resend-test@example.com');
                model.set('role', role);
                model.resend();
            });

            expect(
                server.handledRequests.length,
                'number of requests'
            ).to.equal(1);

            let [lastRequest] = server.handledRequests;
            let requestBody = JSON.parse(lastRequest.requestBody);
            let [invite] = requestBody.invites;

            expect(
                requestBody.invites.length,
                'number of invites in request body'
            ).to.equal(1);

            expect(invite.email).to.equal('resend-test@example.com');
            // eslint-disable-next-line camelcase
            expect(invite.role_id, 'role ID').to.equal('1');
        });
    });
});
