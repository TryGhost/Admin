import Model from 'ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import attr from 'ember-data/attr';
import {belongsTo, hasMany} from 'ember-data/relationships';
import {computed} from '@ember/object';
import {equal} from '@ember/object/computed';
import {inject as service} from '@ember/service';

export default Model.extend(ValidationEngine, {
    feature: service(),

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

    parent: belongsTo('tag', {inverse: 'children', async: false}),
    children: hasMany('tag', {inverse: 'parent', async: false}),

    isInternal: equal('visibility', 'internal'),
    isPublic: equal('visibility', 'public'),

    // nestedName is used for sorting and display in dropdowns
    //
    // TODO: this is very inefficient. Luckily we always have all tags in
    // memory when requesting the nested name, otherwise there would be a separate
    // network request for each parent - we probably want to resolve this at the
    // API level
    nestedName: computed('parent', function () {
        if (!this.belongsTo('parent').id()) {
            return this.name;
        }

        let names = [this.name];
        let parent = this.parent;

        let count = 1;
        while (parent && count <= 10) {
            names.unshift(parent.name);
            parent = parent.parent;
            count += 1;
            if (count >= 10) {
                console.log('infinite loop escape', names);
            }
        }

        return names.join('/');
    }),

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
