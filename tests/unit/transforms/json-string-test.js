import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';

describe('Unit: Transform: json-string', function () {
    setupTest('transform:json-string', {});

    it('serialises an Object to a JSON String', function () {
        let transform = this.subject();
        let obj = {one: 'one', two: 'two'};
        expect(transform.serialize(obj)).to.equal(JSON.stringify(obj));
    });

    it('deserialises a JSON String to an Object', function () {
        let transform = this.subject();
        let obj = {one: 'one', two: 'two'};
        expect(transform.deserialize(JSON.stringify(obj))).to.deep.equal(obj);
    });

    it('handles deserializing a blank string', function () {
        let transform = this.subject();
        expect(transform.deserialize('')).to.equal(null);
    });
});
