import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';

describe('Unit: Service: unsplash', function() {
    setupTest('service:unsplash', {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
    });

  // Replace this with your real tests.
    it('exists', function() {
        let service = this.subject();
        expect(service).to.be.ok;
    });
});
