import {A as emberA} from 'ember-array/utils';

import {NewUserModel} from './new-user';
import validations from 'ghost-admin/utils/validations';

const ValidationsMixin = validations('setup');

export default NewUserModel.extend(ValidationsMixin, {
    /**
     * Title of the blog
     * @type {String}
     */
    blogTitle: '',

    /**
     * Users to invite to the blog
     * @type {Array}
     */
    users: emberA(),

    /**
     * After the blog is created, this is set to true to enable
     * re-setting of user data
     *
     * @type {Boolean}
     * @property created
     */
    created: false,

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

            this.set('createdUser', result.users[0]);
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
            createdUser: null
        });
    }
});
