import EmberObject from 'ember-object';
import RSVP from 'rsvp';
import injectService from 'ember-service/inject';
import validations from 'ghost-admin/utils/validations';
import Model from 'ember-data/model';

const {Promise, resolve} = RSVP;
const ValidationsMixin = validations('newUser');

const NewUserModel = EmberObject.extend({
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
     * @type {Object}
     */
    createdUser: null,

    ghostPaths: injectService(),
    config: injectService(),
    ajax: injectService(),

    /**
     * Uploads the given data image, then sends the changed user image property to the server
     *
     * @method saveImage
     * @return {Promise} A promise that takes care of both calls
     */
    saveImage(user) {
        let image = this.get('image');

        if (!image) {
            return resolve();
        }

        return new Promise((resolve, reject) => {
            image.formData = {};
            image.submit()
                .success((response) => {
                    user = user || this.get('createdUser');

                    if (user instanceof Model) {
                        user.set('image', response);
                        user.save().then(resolve).catch(reject);
                        return;
                    }

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
        let signupUrl = this.get('ghostPaths.url').api('authentication', 'invitation');
        let signupData = this.getProperties('name', 'email', 'password', 'token');

        return this.get('ajax').post(signupUrl, {
            data: {invitation: [signupData]}
        });
    }
});

export default NewUserModel.extend(ValidationsMixin);

// Setup model extends this so we need to export it
export {NewUserModel};
