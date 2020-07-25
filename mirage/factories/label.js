import {Factory} from 'ember-cli-mirage';

export default Factory.extend({
    name(i) { return `Label ${i}`;},
    slug(i) { return `label-${i}`;},
    createdAt: '2020-07-23T15:50:00.000Z',
    createdBy: 1,
    updatedAt: '2020-07-23T15:50:00.000Z',
    updatedBy: 1
});
