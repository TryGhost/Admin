import Model, {attr, hasMany} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';

export default Model.extend(ValidationEngine, {
    validationType: 'member',

    name: attr('string'),
    email: attr('string'),
    note: attr('string'),
    createdAtUTC: attr('moment-utc'),
    stripe: attr('member-subscription'),
    subscribed: attr('boolean', {defaultValue: true}),
    labels: hasMany('label', {embedded: 'always', async: false}),
    comped: attr('boolean', {defaultValue: false})
});
