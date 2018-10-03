import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import {belongsTo} from 'ember-data/relationships';

export default Model.extend({
    type: attr('string'),
    secret: attr('string'),
    lastSeenAt: attr('moment-utc'),
    createdAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedAtUTC: attr('moment-utc'),
    updatedBy: attr('number'),

    integration: belongsTo('integration')
});
