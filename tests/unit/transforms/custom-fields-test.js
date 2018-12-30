import CustomFieldItem from 'ghost-admin/models/custom-field-item';
import {describe, it} from 'mocha';
import {A as emberA} from '@ember/array';
import {expect} from 'chai';
import {setupTest} from 'ember-mocha';

describe('Unit: Transform: custom-fields', function () {
    setupTest('transform:custom-fields', {});
    it('deserializes custom field json', function () {
        let transform = this.subject();
        let serialized = '[{"id":"1","type":"Text","name":"text"},{"id":"2","type":"Number","name":"number"},{"id":"3","type":"Boolean","name":"boolean"}]';
        let result = transform.deserialize(serialized);

        expect(result.length).to.equal(3);
        expect(result[0]).to.be.instanceof(CustomFieldItem);
        expect(result[0].get('id')).to.equal('1');
        expect(result[0].get('type')).to.equal('Text');
        expect(result[0].get('name')).to.equal('text');
        expect(result[1]).to.be.instanceof(CustomFieldItem);
        expect(result[1].get('id')).to.equal('2');
        expect(result[1].get('type')).to.equal('Number');
        expect(result[1].get('name')).to.equal('number');
        expect(result[2]).to.be.instanceof(CustomFieldItem);
        expect(result[2].get('id')).to.equal('3');
        expect(result[2].get('type')).to.equal('Boolean');
        expect(result[2].get('name')).to.equal('boolean');
    });

    it('serializes array of CustomFieldItems', function () {
        let transform = this.subject();
        let deserialized = emberA([
            CustomFieldItem.create({id: '1', type: 'Text', name: 'text'}),
            CustomFieldItem.create({id: '2', type: 'Number', name: 'number'}),
            CustomFieldItem.create({id: '3', type: 'Boolean', name: 'boolean'})
        ]);
        let result = transform.serialize(deserialized);

        expect(result).to.equal('[{"id":"1","type":"Text","name":"text"},{"id":"2","type":"Number","name":"number"},{"id":"3","type":"Boolean","name":"boolean"}]');
    });
});
