import EmberObject from 'ember-object';
import injectService from 'ember-service/inject';
import computed from 'ember-computed';
import {isBlank} from 'ember-utils';

import validations from 'ghost-admin/utils/validations';

const ValidationsMixin = validations('reset');

export default EmberObject.extend(ValidationsMixin, {
    user: null,

    oldPassword: '',
    newPassword: '',
    ne2Password: '',

    ghostPaths: injectService(),
    ajax: injectService(),
    session: injectService(),

    isLoggedIn: computed('user.id', 'session.user.id', function () {
        return this.get('user.id') === this.get('session.user.id');
    }),

    validate() {
        let changeset = this.get('changeset');

        this.validateOldPassword();

        return changeset.validate();
    },

    /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
    save() {
        let passwordChangeUrl = this.get('ghostPaths.url').api('users', 'password');
        let user_id = this.get('user.id');
        let {oldPassword, newPassword, ne2Password} = this.getProperties('oldPassword', 'newPassword', 'ne2Password');

        return this.get('ajax').put(passwordChangeUrl, {
            data: {
                password: [{user_id, oldPassword, newPassword, ne2Password}]
            }
        }).then(() => {
            this.clear();
        });
    },
    /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

    clear() {
        this.setProperties({
            oldPassword: '',
            newPassword: '',
            ne2Password: ''
        });
    },

    validateOldPassword() {
        let changeset = this.get('changeset');

        if (this.get('isLoggedIn') && isBlank(changeset.get('oldPassword'))) {
            changeset.addError('oldPassword', 'Your current password is required to set a new one.');
        }
    }
});
