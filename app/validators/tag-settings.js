import BaseValidator from './base';
import validator from 'npm:validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    properties: ['name', 'slug', 'description', 'metaTitle', 'metaDescription'],

    name(model) {
        let name = model.get('name');

        if (isBlank(name)) {
            model.get('errors').add('name', this.t('validation.You must specify a name for the tag.'));
            this.invalidate();
        } else if (name.match(/^,/)) {
            model.get('errors').add('name', this.t('validation.Tag names can\'t start with commas.'));
            this.invalidate();
        } else if (!validator.isLength(name, 0, 191)) {
            model.get('errors').add('name', this.t('validation.Tag names cannot be longer than 191 characters.'));
            this.invalidate();
        }
    },

    slug(model) {
        let slug = model.get('slug');

        if (!validator.isLength(slug || '', 0, 191)) {
            model.get('errors').add('slug', this.t('validation.URL cannot be longer than 191 characters.'));
            this.invalidate();
        }
    },

    description(model) {
        let description = model.get('description');

        if (!validator.isLength(description || '', 0, 500)) {
            model.get('errors').add('description', this.t('validation.Description cannot be longer than 500 characters.'));
            this.invalidate();
        }
    },

    metaTitle(model) {
        let metaTitle = model.get('metaTitle');

        if (!validator.isLength(metaTitle || '', 0, 300)) {
            model.get('errors').add('metaTitle', this.t('validation.Meta Title cannot be longer than 300 characters.'));
            this.invalidate();
        }
    },

    metaDescription(model) {
        let metaDescription = model.get('metaDescription');

        if (!validator.isLength(metaDescription || '', 0, 500)) {
            model.get('errors').add('metaDescription', this.t('validation.Meta Description cannot be longer than 500 characters.'));
            this.invalidate();
        }
    }
});
