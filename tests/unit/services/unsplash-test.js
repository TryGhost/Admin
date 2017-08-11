import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';

describe('Unit: Service: unsplash', function() {
    setupTest('service:unsplash', {
        needs: [
            'service:config',
            'service:settings'
        ]
    });

  // Replace this with your real tests.
    it('exists', function() {
        let service = this.subject();
        expect(service).to.be.ok;
    });
});
