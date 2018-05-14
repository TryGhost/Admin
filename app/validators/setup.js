import NewUserValidator from 'ghost-admin/validators/new-user';
import validator from 'npm:validator';

export default NewUserValidator.create({
    properties: ['name', 'email', 'password', 'blogTitle'],

    blogTitle(model) {
        let blogTitle = model.get('blogTitle');

        if (!validator.isLength(blogTitle || '', 1)) {
            model.get('errors').add('blogTitle', this.t('validation.Please enter a blog title.'));
            this.invalidate();
        }

        if (!validator.isLength(blogTitle || '', 0, 150)) {
            model.get('errors').add('blogTitle', this.t('validation.Title is too long'));
            this.invalidate();
        }
    }
});
