import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {errorOverride, errorReset} from '../../helpers/adapter-error';
import {expect} from 'chai';
import {find} from 'ember-native-dom-helpers';
import {setupComponentTest} from 'ember-mocha';
import {task, timeout} from 'ember-concurrency';

const upgradesStub = Service.extend({
    isAllowed: true,
    upgradeMessage: '',
    wait: 0,

    check: task(function* (version) {
        // configurable timeout to test loading states
        yield timeout(this.wait);

        // call a stub method to test calls and allow easier behaviour switches
        return yield this._check(version);
    }),

    _check: sinon.stub()
});

describe('Integration: Component: gh-upgrade-notification', function () {
    setupComponentTest('gh-upgrade-notification', {
        integration: true
    });

    beforeEach(function () {
        this.register('service:upgrades', upgradesStub);
        this.inject.service('upgrades');

        // reset stub so that call counts etc are as expected
        this.get('upgrades')._check = sinon.stub();
    });

    it('triggers upgrade check on render', async function () {
        this.set('version', '1.13.0');

        this.render(hbs`
            {{#gh-upgrade-notification version=version as |upgradeCheck|}}
            {{/gh-upgrade-notification}}
        `);
        await wait();

        expect(this.get('upgrades')._check.calledOnce).to.be.true;
        expect(this.get('upgrades')._check.getCall(0).args[0]).to.equal('1.13.0');
    });

    it('displays loading message', async function () {
        this.get('upgrades').wait = 200;

        this.render(hbs`
            {{#gh-upgrade-notification version=version as |upgradeCheck|}}
                <span>
                    {{#if upgradeCheck.isRunning}}
                        Running
                    {{else}}
                        Done
                    {{/if}}
                </span>
            {{/gh-upgrade-notification}}
        `);

        await timeout(100);

        expect(find('span').textContent).to.have.string('Running');

        await wait();

        expect(find('span').textContent).to.have.string('Done');
    });

    it('displays error message', async function () {
        this.get('upgrades')._check = sinon.stub().throws();

        errorOverride();
        this.render(hbs`
            {{#gh-upgrade-notification version=version as |upgradeCheck|}}
                <span>
                    {{#if upgradeCheck.isError}}
                        Error
                    {{/if}}
                </span>
            {{/gh-upgrade-notification}}
        `);
        await wait();
        errorReset();

        expect(find('span').textContent).to.have.string('Error');
    });

    it('displays upgrade message', async function () {
        this.set('upgrades.upgradeMessage', 'Upgrade available');

        this.render(hbs`
            {{#gh-upgrade-notification version=version as |upgradeCheck|}}
                <span>{{upgradeCheck.message}}</span>
            {{/gh-upgrade-notification}}
        `);
        await wait();

        expect(find('span').textContent).to.have.string('Upgrade available');
    });
});
