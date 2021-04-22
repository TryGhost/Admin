import Model, {attr} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';

export default Model.extend(ValidationEngine, {
    validationType: 'member-products',

    name: attr('string'),
    slug: attr('string'),
    subscriptions: attr('member-subscription')
});
