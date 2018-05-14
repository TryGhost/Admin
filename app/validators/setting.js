import BaseValidator from './base';
import validator from 'npm:validator';

export default BaseValidator.create({
    properties: ['title', 'description', 'password'],
    title(model) {
        let title = model.get('title');

        if (!validator.isLength(title || '', 0, 150)) {
            model.get('errors').add('title', this.t('validation.Title is too long'));
            this.invalidate();
        }
    },

    description(model) {
        let desc = model.get('description');

        if (!validator.isLength(desc || '', 0, 200)) {
            model.get('errors').add('description', this.t('validation.Description is too long'));
            this.invalidate();
        }
    },

    password(model) {
        let isPrivate = model.get('isPrivate');
        let password = model.get('password');

        if (isPrivate && password === '') {
            model.get('errors').add('password', this.t('validation.Password must be supplied'));
            this.invalidate();
        }
    }
});
