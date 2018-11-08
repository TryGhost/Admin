import Model from 'ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import attr from 'ember-data/attr';
import {belongsTo} from 'ember-data/relationships';
import {equal} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Model.extend(ValidationEngine, {
    validationType: 'tag',

    name: attr('string'),
    slug: attr('string'),
    description: attr('string'),
    metaTitle: attr('string'),
    metaDescription: attr('string'),
    featureImage: attr('string'),
    visibility: attr('string', {defaultValue: 'public'}),
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedBy: attr('number'),
    count: attr('raw'),

    parent: belongsTo('tag', {inverse: 'parent', async: false}),

    isInternal: equal('visibility', 'internal'),
    isPublic: equal('visibility', 'public'),

    feature: service(),

    updateVisibility() {
        let internalRegex = /^#.?/;
        this.set('visibility', internalRegex.test(this.get('name')) ? 'internal' : 'public');
    },

    save() {
        if (this.get('changedAttributes.name') && !this.get('isDeleted')) {
            this.updateVisibility();
        }
        return this._super(...arguments);
    }
});
