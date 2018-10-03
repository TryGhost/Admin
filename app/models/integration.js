import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {hasMany} from 'ember-data/relationships';

export default Model.extend({
    name: attr('string'),
    slug: attr('string'),
    iconImage: attr('string'),
    description: attr('string'),
    createdAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedAtUTC: attr('moment-utc'),
    updatedBy: attr('number'),

    apiKeys: hasMany('api-key'),
    webhooks: hasMany('webhook')
});
