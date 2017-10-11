import Pretender from 'pretender';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {errorOverride, errorReset} from '../../helpers/adapter-error';
import {expect} from 'chai';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-mocha';

describe('Unit: Service: upgrades', function() {
    setupTest('service:upgrades', {
        // Specify the other units that are required for this test.
        needs: [
            'service:ajax',
            'service:config',
            'service:ghostPaths',
            'service:session'
        ]
    });

    let server;

    beforeEach(function () {
        server = new Pretender();
    });

    afterEach(function () {
        server.shutdown();
    });

    describe('check task', function () {
        it('has error state on request failure', async function () {
            server.get('https://updates.ghost.org/', function () {
                return [404, {}, 'Not Found'];
            });

            let service = this.subject();

            service.get('config').set('allowUpgradeCheck', true);

            errorOverride();
            run(() => {
                service.get('check').perform('1.13.0');
            });
            await wait();
            errorReset();

            expect(service.get('check.last.isError')).to.be.true;
        });

        it('sets up-to-date message on version match', async function () {
            server.get('https://updates.ghost.org/', function () {
                return [200, {'Content-Type': 'application/json'}, JSON.stringify({
                    id: 23,
                    version: '1.13.0'
                })];
            });

            let service = this.subject();

            service.get('config').set('allowUpgradeCheck', true);

            run(() => {
                service.get('check').perform('1.13.0');
            });
            await wait();

            expect(service.get('upgradeMessage')).to.equal('You\'re up-to-date!');
        });

        it('sets upgrade message if available', async function () {
            server.get('https://updates.ghost.org/', function () {
                return [200, {'Content-Type': 'application/json'}, JSON.stringify({
                    id: 23,
                    version: '1.13.0',
                    messages: [{
                        content: 'Update available! Ghost <a href="https://github.com/TryGhost/Ghost/releases">1.13.0</a> has been released, <a href="https://docs.ghost.org/docs/upgrade">click here</a> to upgrade.'
                    }]
                })];
            });

            let service = this.subject();

            service.get('config').set('allowUpgradeCheck', true);

            run(() => {
                service.get('check').perform('1.12.0');
            });
            await wait();

            expect(service.get('upgradeMessage')).to.have.string('Update available!');
            expect(service.get('upgradeMessage')).to.have.string('1.13.0');
        });
    });
});
