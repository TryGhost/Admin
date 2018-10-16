import Model from 'ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import attr from 'ember-data/attr';
import {computed} from '@ember/object';
import {hasMany} from 'ember-data/relationships';

export default Model.extend(ValidationEngine, {
    validationType: 'integration',

    name: attr('string'),
    slug: attr('string'),
    iconImage: attr('string'),
    description: attr('string'),
    createdAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedAtUTC: attr('moment-utc'),
    updatedBy: attr('number'),

    apiKeys: hasMany('api-key', {
        embedded: 'always',
        async: false
    }),
    webhooks: hasMany('webhook', {
        embedded: 'always',
        async: false
    }),

    adminKey: computed('apiKeys.[]', function () {
        return this.apiKeys.findBy('type', 'admin');
    }),

    contentKey: computed('apiKeys.[]', function () {
        return this.apiKeys.findBy('type', 'content');
    })
});
