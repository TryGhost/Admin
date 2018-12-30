import CustomFieldItem from 'ghost-admin/models/custom-field-item';
import validator from 'ghost-admin/validators/customfield-item';
import {describe, it} from 'mocha';
import {expect} from 'chai';

describe('Unit: Validator: customfield-item', function () {
    it('requires name presence', function () {
        let cfItem = CustomFieldItem.create();

        validator.check(cfItem, 'name');

        expect(validator.get('passed')).to.be.false;
        expect(cfItem.get('errors').errorsFor('name').toArray()).to.deep.equal([{
            attribute: 'name',
            message: 'You must specify a field name'
        }]);
        expect(cfItem.get('hasValidated')).to.include('name');
    });

    it('validates type and name by default', function () {
        let cfItem = CustomFieldItem.create();

        validator.check(cfItem);

        expect(cfItem.get('errors').errorsFor('type')).to.be.empty;
        expect(cfItem.get('type')).to.equal('Text');
        expect(cfItem.get('errors').errorsFor('name')).to.not.be.empty;
        expect(validator.get('passed')).to.be.false;
    });

    it('fails on invalid field type values', function () {
        let cfItem = CustomFieldItem.create({type: 'invalid'});

        validator.check(cfItem, 'type');

        expect(validator.get('passed')).to.be.false;
        expect(cfItem.get('errors').errorsFor('type').toArray()).to.deep.equal([{
            attribute: 'type',
            message: 'You must specify a valid field type'
        }]);
        expect(cfItem.get('hasValidated')).to.include('type');
    });

    it('passes on valid type values', function () {
        let fieldTypes = CustomFieldItem.create().get('fieldTypes');

        for (let type of fieldTypes) {
            let cfItem = CustomFieldItem.create({type: type});

            validator.check(cfItem, 'type');

            expect(validator.get('passed')).to.be.true;
            expect(cfItem.get('hasValidated')).to.include('type');
        }
    });
});
