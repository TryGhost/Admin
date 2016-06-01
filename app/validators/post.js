import BaseValidator from './base';
import isBlank from 'ember-utils/isBlank';
import isLength from 'validator/lib/isLength';

export default BaseValidator.create({
    properties: ['title', 'metaTitle', 'metaDescription'],

    title(model) {
        let title = model.get('title');

        if (isBlank(title)) {
            model.get('errors').add('title', 'You must specify a title for the post.');
            this.invalidate();
        }

        if (!isLength(title, 0, 150)) {
            model.get('errors').add('title', 'Title cannot be longer than 150 characters.');
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
