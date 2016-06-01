import NewUserValidator from 'ghost/validators/new-user';
import isLength from 'validator/lib/isLength';

export default NewUserValidator.create({
    properties: ['name', 'email', 'password', 'blogTitle'],

    blogTitle(model) {
        let blogTitle = model.get('blogTitle');

        if (!isLength(blogTitle, 1)) {
            model.get('errors').add('blogTitle', 'Please enter a blog title.');
            this.invalidate();
        }
    }
});
