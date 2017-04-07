import {expect} from 'chai';
import {describe, it} from 'mocha';
import {wordPluralize} from 'ghost-admin/helpers/word-pluralize';

describe('Unit | Helper | word pluralize', function() {
    // Replace this with your real tests.
    it('works', function() {
        let result0 = wordPluralize([0, 'word']);
        let result1 = wordPluralize([1, 'word']);
        let result2 = wordPluralize([2, 'word']);
        let result42 = wordPluralize([42, 'word']);
        expect(result0).to.equal('word');
        expect(result1).to.equal('word');
        expect(result2).to.equal('words');
        expect(result42).to.equal('words');
    });
});

