import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';

describe('Unit: Model: custom-field-item', function () {
    setupTest('model:custom-field-item', {
        // Specify the other units that are required for this test.
        needs: []
    });

    it('isComplete is true when type and name are filled', function () {
        let model = this.subject();

        model.set('type', 'Text');
        model.set('name', 'test');

        expect(model.get('isComplete')).to.be.true;
    });

    it('isComplete is false when type is blank', function () {
        let model = this.subject();

        model.set('type', '');
        model.set('name', 'test');

        expect(model.get('isComplete')).to.be.false;
    });

    it('isComplete is false when name is blank', function () {
        let model = this.subject();

        model.set('type', 'Text');
        model.set('url', '');

        expect(model.get('isComplete')).to.be.false;
    });

    it('isBlank is true when type and name are blank', function () {
        let model = this.subject();

        model.set('type', '');
        model.set('name', '');

        expect(model.get('isBlank')).to.be.true;
    });

    it('isBlank is false when type is present', function () {
        let model = this.subject();

        model.set('type', 'Text');
        model.set('name', '');

        expect(model.get('isBlank')).to.be.false;
    });

    it('isBlank is false when name is present', function () {
        let model = this.subject();

        model.set('type', '');
        model.set('name', 'test');

        expect(model.get('isBlank')).to.be.false;
    });
});
