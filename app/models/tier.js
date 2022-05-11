// import Model, {attr} from '@ember-data/model';
// import ValidationEngine from 'ghost-admin/mixins/validation-engine';

// class Tier extends Model {
//     /** @type {string} */
//     @attr name;

//     /** @type {string} */
//     @attr description;

//     /** @type {string} */
//     @attr active;

//     /** @type {boolean} */
//     @attr slug;

//     /** @type {string} */
//     @attr welcomePageURL;

//     /** @type {'none'|'public'} */
//     @attr({defaultValue: 'none'}) visibility;

//     /** @type {'free'|'paid'} */
//     @attr({defaultValue: 'paid'}) type;

//     /** @type {string} */
//     @attr currency;

//     /** @type {number} */
//     @attr monthlyPrice;

//     /** @type {number} */
//     @attr yearlyPrice;

//     /** @type {string[]} */
//     @attr benefits;
// }

// export default Tier.extend(ValidationEngine, {
//     validationType: 'tier'
// });

import Model, {attr} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';

export default Model.extend(ValidationEngine, {
    validationType: 'tier',

    name: attr('string'),
    description: attr('string'),
    active: attr('boolean'),
    slug: attr('string'),
    welcomePageURL: attr('string'),
    visibility: attr('string', {defaultValue: 'none'}),
    type: attr('string', {defaultValue: 'paid'}),
    currency: attr('string'),
    monthlyPrice: attr('number'),
    yearlyPrice: attr('number'),
    benefits: attr('tier-benefits')
});
