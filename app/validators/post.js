import BaseValidator from './base';

export default BaseValidator.create({
    properties: ['title', 'metaTitle', 'metaDescription'],

    title(model) {
        let title = model.get('title');

        if (validator.empty(title)) {
            model.get('errors').add('title', 'You must specify a title for the post.');
            this.invalidate();
        }

        if (!validator.isLength(title, 0, 255)) {
            model.get('errors').add('title', 'Title cannot be longer than 255 characters.');
            this.invalidate();
        }
    },

    metaTitle(model) {
        let metaTitle = model.get('metaTitle');

        if (!validator.isLength(metaTitle, 0, 300)) {
            model.get('errors').add('metaTitle', 'Meta Title cannot be longer than 300 characters.');
            this.invalidate();
        }
    },

    metaDescription(model) {
        let metaDescription = model.get('metaDescription');

        if (!validator.isLength(metaDescription, 0, 500)) {
            model.get('errors').add('metaDescription', 'Meta Description cannot be longer than 500 characters.');
            this.invalidate();
        }
    }
});
