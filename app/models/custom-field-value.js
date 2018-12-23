import Model from 'ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import attr from 'ember-data/attr';
import {belongsTo} from 'ember-data/relationships';

export default Model.extend(ValidationEngine, {
    post: belongsTo('post'),

    field_id: attr('string'),
    type: attr('string'),
    name: attr('string'),
    value: attr('string')
});
