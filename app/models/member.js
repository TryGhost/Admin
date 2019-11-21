import DS from 'ember-data';
import attr from 'ember-data/attr';

export default DS.Model.extend({
    name: attr('string'),
    email: attr('string'),
    note: attr('string'),
    createdAtUTC: attr('moment-utc'),
    stripe: attr('member-subscription')
});
