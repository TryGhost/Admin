import EmberObject from 'ember-object';
import RSVP from 'rsvp';
import {A as emberA} from 'ember-array/utils';
import injectService from 'ember-service/inject';

import validations from 'ghost-admin/utils/validations';

const {Promise, resolve} = RSVP;
const ValidationsMixin = validations('setup');

export default EmberObject.extend(ValidationsMixin, {
    /**
     * Title of the blog
     * @type {String}
     */
    blogTitle: '',

    /**
     * Name of the blog owner
     * @type {String}
     */
    name: '',

    /**
     * Email of the blog owner
     * @type {String}
     */
    email: '',

    /**
     * Password of the blog owner
     * @type {String}
     */
    password: '',

    /**
     * Profile image of the blog owner
     * @type {Object}
     */
    image: null,

    /**
     * Users to invite to the blog
     * @type {Array}
     */
    users: emberA(),

    /**
     * After the blog is created, this will hold a reference to the
     * created user data returned from the server
     * @type {Object}
     */
    createdOwnerUser: null,

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
                    let user = this.get('createdOwnerUser');
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
        let method = this.get('created') ? 'put' : 'post';
        let setupData = this.getProperties('name', 'email', 'password', 'blogTitle');

        return this.get('ajax')[method](setupUrl, {
            data: {setup: [setupData]}
        }).then((result) => {
            this.get('config').set('blogTitle', setupData.blogTitle);

            this.set('createdOwnerUser', result.users[0]);
        });
    },

    reset() {
        this.setProperties({
            blogTitle: '',
            name: '',
            email: '',
            password: '',
            users: emberA(),
            created: false,
            createdOwnerUser: null
        });
    }
});
