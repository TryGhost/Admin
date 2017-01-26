/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupTest} from 'ember-mocha';

describe('UpgradeStatusService', function() {
    setupTest('service:upgrade-status', {
        // Specify the other units that are required for this test.
        // needs: ['service:foo']
        needs: []
    });

    // Replace this with your real tests.
    it('exists', function() {
        let service = this.subject();
        expect(service).to.be.ok;
    });
});
