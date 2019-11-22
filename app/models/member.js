import DS from 'ember-data';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import attr from 'ember-data/attr';

export default DS.Model.extend(ValidationEngine, {
    validationType: 'member',

    name: attr('string'),
    email: attr('string'),
    note: attr('string'),
    createdAtUTC: attr('moment-utc'),
    stripe: attr('member-subscription')
});
