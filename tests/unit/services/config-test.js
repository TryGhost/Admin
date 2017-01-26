/* jshint expr:true */
import {expect} from 'chai';
import {describe, it} from 'mocha';
import {setupTest} from 'ember-mocha';

describe('Unit: Service: config', function () {
    setupTest('service:config', {});
    // Replace this with your real tests.
    it('exists', function () {
        let service = this.subject();
        expect(service).to.be.ok;
    });
});
