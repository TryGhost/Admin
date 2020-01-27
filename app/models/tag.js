import Model, {attr} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {equal} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Model.extend(ValidationEngine, {
    validationType: 'tag',

    name: attr('string'),
    slug: attr('string'),
    description: attr('string'),
    parent: attr('string'), // unused
    metaTitle: attr('string'),
    metaDescription: attr('string'),
    featureImage: attr('string'),
    visibility: attr('string', {defaultValue: 'public'}),
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc'),
    createdBy: attr('number'),
    updatedBy: attr('number'),
    count: attr('raw'),

    isInternal: equal('visibility', 'internal'),
    isPublic: equal('visibility', 'public'),

    feature: service(),

    updateVisibility() {
        let internalRegex = /^#.?/;
        this.set('visibility', internalRegex.test(this.name) ? 'internal' : 'public');
    },

    save() {
        if (this.get('changedAttributes.name') && !this.isDeleted) {
            this.updateVisibility();
        }
        return this._super(...arguments);
    }
});
