import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isLength from 'validator/lib/isLength';

export default BaseValidator.create({
    properties: ['name', 'slug', 'description', 'metaTitle', 'metaDescription'],

    name(model) {
        let name = model.get('name');

        if (isBlank(name)) {
            model.get('errors').add('name', 'You must specify a name for the tag.');
            this.invalidate();
        } else if (name.match(/^,/)) {
            model.get('errors').add('name', 'Tag names can\'t start with commas.');
            this.invalidate();
        } else if (!isLength(name, 0, 150)) {
            model.get('errors').add('name', 'Tag names cannot be longer than 150 characters.');
            this.invalidate();
        }
    },

    slug(model) {
        let slug = model.get('slug');

        if (!isLength(slug, 0, 150)) {
            model.get('errors').add('slug', 'URL cannot be longer than 150 characters.');
            this.invalidate();
        }
    },

    description(model) {
        let description = model.get('description');

        if (!isLength(description, 0, 200)) {
            model.get('errors').add('description', 'Description cannot be longer than 200 characters.');
            this.invalidate();
        }
    },

    metaTitle(model) {
        let metaTitle = model.get('metaTitle');

        if (!isLength(metaTitle, 0, 150)) {
            model.get('errors').add('metaTitle', 'Meta Title cannot be longer than 150 characters.');
            this.invalidate();
        }
    },

    metaDescription(model) {
        let metaDescription = model.get('metaDescription');

        if (!isLength(metaDescription, 0, 200)) {
            model.get('errors').add('metaDescription', 'Meta Description cannot be longer than 200 characters.');
            this.invalidate();
        }
    }
});
