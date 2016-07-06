import EmberObject from 'ember-object';
import RSVP from 'rsvp';
import injectService from 'ember-service/inject';

import validations from 'ghost-admin/utils/validations';

const {Promise, resolve} = RSVP;
const ValidationsMixin = validations('setup');

export default EmberObject.extend(ValidationsMixin, {
    blogTitle: null,
    name: null,
    email: '',
    password: null,
    image: null,

    /**
     * After the blog is created, this will hold a reference to the
     * created user data returned from the server
     * @type {Object}
     */
    user: null,

    /**
     * After the blog is created, this is set to true to enable
     * re-setting of user data
     *
     * @type {Boolean}
     * @property created
     */
    created: false,

    ghostPaths: injectService(),
    config: injectService(),
    ajax: injectService(),

    /**
     * Uploads the given data image, then sends the changed user image property to the server
     *
     * @method saveImage
     * @return {Promise} A promise that takes care of both calls
     */
    saveImage() {
        let image = this.get('image');

        if (!image) {
            return resolve();
        }

        return new Promise((resolve, reject) => {
            image.formData = {};
            image.submit()
                .success((response) => {
                    let user = this.get('user');
                    let usersUrl = this.get('ghostPaths.url').api('users', user.id.toString());
                    user.image = response;

                    this.get('ajax').put(usersUrl, {
                        data: {users: [user]}
                    }).then(resolve).catch(reject);
                })
                .error(reject);
        });
    },

    /**
     * Called by the changeset save method, this either sets up the blog
     * or re-sets the owner user's properties. Also handles changing of the
     * blog title
     *
     * @method save
     * @return {Promise}
     */
    save() {
        let setupUrl = this.get('ghostPaths.url').api('authentication', 'setup');
        let method = this.get('alreadyCreated') ? 'put' : 'post';
        let setupData = this.getProperties('name', 'email', 'password', 'blogTitle');

        return this.get('ajax')[method](setupUrl, {
            data: {setup: [setupData]}
        }).then((result) => {
            this.get('config').set('blogTitle', setupData.blogTitle);

            this.set('user', result.users[0]);
        });
    }
});
