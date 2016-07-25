/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import CurrentUserSettings from 'ghost-admin/mixins/current-user-settings';
import styleBody from 'ghost-admin/mixins/style-body';
import ChangePasswordModel from 'ghost-admin/models/change-password';
import createContainerObject from 'ghost-admin/utils/container-object';

export default AuthenticatedRoute.extend(styleBody, CurrentUserSettings, {
    titleToken: 'Team - User',

    classNames: ['team-view-user'],

    model(params) {
        return this.store.queryRecord('user', {slug: params.user_slug, include: 'count.posts'});
    },

    serialize(model) {
        return {user_slug: model.get('slug')};
    },

    afterModel(user) {
        this._super(...arguments);

        return this.get('session.user').then((currentUser) => {
            let isOwnProfile = user.get('id') === currentUser.get('id');
            let isAuthor = currentUser.get('isAuthor');
            let isEditor = currentUser.get('isEditor');

            if (isAuthor && !isOwnProfile) {
                this.transitionTo('team.user', currentUser);
            } else if (isEditor && !isOwnProfile && !user.get('isAuthor')) {
                this.transitionTo('team');
            }
        });
    },

    setupController(controller, user) {
        this._super(...arguments);

        controller.set('passwordModel', createContainerObject(ChangePasswordModel, this, {user}));
    },

    deactivate() {
        let model = this.modelFor('team.user');

        // we want to revert any unsaved changes on exit
        if (model && model.get('hasDirtyAttributes')) {
            model.rollbackAttributes();
        }

        this._super(...arguments);
    },

    actions: {
        didTransition() {
            this.controller.get('model.changeset').clear();
        },

        save() {
            this.get('controller').send('save');
        }
    }
});
