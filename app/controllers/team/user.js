import Controller from 'ember-controller';
import RSVP from 'rsvp';
import computed, {alias, and, not, or, readOnly} from 'ember-computed';
import injectService from 'ember-service/inject';
import {htmlSafe} from 'ember-string';
import {isEmberArray} from 'ember-array/utils';

import isNumber from 'ghost-admin/utils/isNumber';
import boundOneWay from 'ghost-admin/utils/bound-one-way';
import SocialValidationsMixin from 'ghost-admin/mixins/social-validation';

export default Controller.extend(SocialValidationsMixin, {
    submitting: false,
    updatingPassword: false,
    lastPromise: null,

    // for social validations mixin
    modelKey: 'user',

    showDeleteUserModal: false,
    showTransferOwnerModal: false,
    showUploadCoverModal: false,
    showUplaodImageModal: false,

    ajax: injectService(),
    dropdown: injectService(),
    ghostPaths: injectService(),
    notifications: injectService(),
    session: injectService(),
    slugGenerator: injectService(),

    user: alias('model'),
    currentUser: alias('session.user'),

    email: readOnly('model.email'),
    slugValue: boundOneWay('model.slug'),

    isNotOwnersProfile: not('user.isOwner'),
    isAdminUserOnOwnerProfile: and('currentUser.isAdmin', 'user.isOwner'),
    canAssignRoles: or('currentUser.isAdmin', 'currentUser.isOwner'),
    canMakeOwner: and('currentUser.isOwner', 'isNotOwnProfile', 'user.isAdmin'),
    rolesDropdownIsVisible: and('isNotOwnProfile', 'canAssignRoles', 'isNotOwnersProfile'),
    userActionsAreVisible: or('deleteUserActionIsVisible', 'canMakeOwner'),

    isNotOwnProfile: computed('user.id', 'currentUser.id', function () {
        return this.get('user.id') !== this.get('currentUser.id');
    }),

    deleteUserActionIsVisible: computed('currentUser', 'canAssignRoles', 'user', function () {
        if ((this.get('canAssignRoles') && this.get('isNotOwnProfile') && !this.get('user.isOwner')) ||
            (this.get('currentUser.isEditor') && (this.get('isNotOwnProfile') ||
            this.get('user.isAuthor')))) {
            return true;
        }
    }),

    // duplicated in gh-user-active -- find a better home and consolidate?
    userDefault: computed('ghostPaths', function () {
        return `${this.get('ghostPaths.subdir')}/ghost/img/user-image.png`;
    }),

    userImageBackground: computed('user.image', 'userDefault', function () {
        let url = this.get('user.image') || this.get('userDefault');

        return htmlSafe(`background-image: url(${url})`);
    }),
    // end duplicated

    coverDefault: computed('ghostPaths', function () {
        return `${this.get('ghostPaths.subdir')}/ghost/img/user-cover.png`;
    }),

    coverImageBackground: computed('user.cover', 'coverDefault', function () {
        let url = this.get('user.cover') || this.get('coverDefault');

        return htmlSafe(`background-image: url(${url})`);
    }),

    coverTitle: computed('user.name', function () {
        return `${this.get('user.name')}'s Cover Image`;
    }),

    roles: computed(function () {
        return this.store.query('role', {permissions: 'assign'});
    }),

    _deleteUser() {
        if (this.get('deleteUserActionIsVisible')) {
            let user = this.get('user');
            return user.destroyRecord();
        }
    },

    _deleteUserSuccess() {
        this.get('notifications').closeAlerts('user.delete');
        this.store.unloadAll('post');
        this.transitionToRoute('team');
    },

    _deleteUserFailure() {
        this.get('notifications').showAlert('The user could not be deleted. Please try again.', {type: 'error', key: 'user.delete.failed'});
    },

    actions: {
        changeRole(newRole) {
            this.set('model.role', newRole);
        },

        save() {
            let user = this.get('user');
            let slugValue = this.get('slugValue');
            let afterUpdateSlug = this.get('lastPromise');
            let promise,
                slugChanged;

            if (user.get('slug') !== slugValue) {
                slugChanged = true;
                user.set('slug', slugValue);
            }

            this.toggleProperty('submitting');

            promise = RSVP.resolve(afterUpdateSlug).then(() => {
                return user.save({format: false});
            }).then((model) => {
                let currentPath,
                    newPath;

                // If the user's slug has changed, change the URL and replace
                // the history so refresh and back button still work
                if (slugChanged) {
                    currentPath = window.history.state.path;

                    newPath = currentPath.split('/');
                    newPath[newPath.length - 2] = model.get('slug');
                    newPath = newPath.join('/');

                    window.history.replaceState({path: newPath}, '', newPath);
                }

                this.toggleProperty('submitting');
                this.get('notifications').closeAlerts('user.update');

                return model;
            }).catch((error) => {
                // validation engine returns undefined so we have to check
                // before treating the failure as an API error
                if (error) {
                    this.get('notifications').showAPIError(error, {key: 'user.update'});
                }
                this.toggleProperty('submitting');
            });

            this.set('lastPromise', promise);
            return promise;
        },

        deleteUser() {
            return this._deleteUser().then(() => {
                this._deleteUserSuccess();
            }, () => {
                this._deleteUserFailure();
            });
        },

        toggleDeleteUserModal() {
            if (this.get('deleteUserActionIsVisible')) {
                this.toggleProperty('showDeleteUserModal');
            }
        },

        changePassword() {
            let user = this.get('user');

            if (!this.get('updatingPassword')) {
                this.set('updatingPassword', true);

                return user.saveNewPassword().then((model) => {
                    // Clear properties from view
                    user.setProperties({
                        password: '',
                        newPassword: '',
                        ne2Password: ''
                    });

                    this.get('notifications').showNotification('Password updated.', {type: 'success', key: 'user.change-password.success'});

                    // clear errors manually for ne2password because validation
                    // engine only clears the "validated proeprty"
                    // TODO: clean up once we have a better validations library
                    user.get('errors').remove('ne2Password');

                    return model;
                }).catch((error) => {
                    // error will be undefined if we have a validation error
                    if (error) {
                        this.get('notifications').showAPIError(error, {key: 'user.change-password'});
                    }
                }).finally(() => {
                    this.set('updatingPassword', false);
                });
            }
        },

        updateSlug(newSlug) {
            let afterSave = this.get('lastPromise');
            let promise;

            promise = RSVP.resolve(afterSave).then(() => {
                let slug = this.get('model.slug');

                newSlug = newSlug || slug;
                newSlug = newSlug.trim();

                // Ignore unchanged slugs or candidate slugs that are empty
                if (!newSlug || slug === newSlug) {
                    this.set('slugValue', slug);

                    return;
                }

                return this.get('slugGenerator').generateSlug('user', newSlug).then((serverSlug) => {
                    // If after getting the sanitized and unique slug back from the API
                    // we end up with a slug that matches the existing slug, abort the change
                    if (serverSlug === slug) {
                        return;
                    }

                    // Because the server transforms the candidate slug by stripping
                    // certain characters and appending a number onto the end of slugs
                    // to enforce uniqueness, there are cases where we can get back a
                    // candidate slug that is a duplicate of the original except for
                    // the trailing incrementor (e.g., this-is-a-slug and this-is-a-slug-2)

                    // get the last token out of the slug candidate and see if it's a number
                    let slugTokens = serverSlug.split('-');
                    let check = Number(slugTokens.pop());

                    // if the candidate slug is the same as the existing slug except
                    // for the incrementor then the existing slug should be used
                    if (isNumber(check) && check > 0) {
                        if (slug === slugTokens.join('-') && serverSlug !== newSlug) {
                            this.set('slugValue', slug);

                            return;
                        }
                    }

                    this.set('slugValue', serverSlug);
                });
            });

            this.set('lastPromise', promise);
        },

        transferOwnership() {
            let user = this.get('user');
            let url = this.get('ghostPaths.url').api('users', 'owner');

            this.get('dropdown').closeDropdowns();

            return this.get('ajax').put(url, {
                data: {
                    owner: [{
                        id: user.get('id')
                    }]
                }
            }).then((response) => {
                // manually update the roles for the users that just changed roles
                // because store.pushPayload is not working with embedded relations
                if (response && isEmberArray(response.users)) {
                    response.users.forEach((userJSON) => {
                        let user = this.store.peekRecord('user', userJSON.id);
                        let role = this.store.peekRecord('role', userJSON.roles[0].id);

                        user.set('role', role);
                    });
                }

                this.get('notifications').showAlert(`Ownership successfully transferred to ${user.get('name')}`, {type: 'success', key: 'owner.transfer.success'});
            }).catch((error) => {
                this.get('notifications').showAPIError(error, {key: 'owner.transfer'});
            });
        },

        toggleTransferOwnerModal() {
            if (this.get('canMakeOwner')) {
                this.toggleProperty('showTransferOwnerModal');
            }
        },

        toggleUploadCoverModal() {
            this.toggleProperty('showUploadCoverModal');
        },

        toggleUploadImageModal() {
            this.toggleProperty('showUploadImageModal');
        },

        // TODO: remove those mutation actions once we have better
        // inline validations that auto-clear errors on input
        updatePassword(password) {
            this.set('user.password', password);
            this.get('user.hasValidated').removeObject('password');
            this.get('user.errors').remove('password');
        },

        updateNewPassword(password) {
            this.set('user.newPassword', password);
            this.get('user.hasValidated').removeObject('newPassword');
            this.get('user.errors').remove('newPassword');
        },

        updateNe2Password(password) {
            this.set('user.ne2Password', password);
            this.get('user.hasValidated').removeObject('ne2Password');
            this.get('user.errors').remove('ne2Password');
        }
    }
});
