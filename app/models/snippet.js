import Model, {attr} from '@ember-data/model';
import ValidationEngine from '@tryghost/admin/mixins/validation-engine';

export default Model.extend(ValidationEngine, {
    validationType: 'snippet',

    name: attr('string'),
    mobiledoc: attr('json-string'),
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc')
});
