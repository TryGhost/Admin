import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import base from 'ghost-admin/mixins/editor-base-route';
import ghostPaths from 'ghost-admin/utils/ghost-paths';

export default AuthenticatedRoute.extend(base, {
    titleToken: 'Editor',

    model() {
        return this.get('session.user').then((user) => {
            return this.store.createRecord('post', {
                author: user
            });
        });
    },

    renderTemplate(controller, model) {
        this.render('editor/edit', {
            controller,
            model
        });

        this.render('post-settings-menu', {
            model,
            into: 'application',
            outlet: 'settings-menu'
        });
    },

    setupController(controller) {
        let psm = this.controllerFor('post-settings-menu');

        // make sure there are no titleObserver functions hanging around
        // from previous posts
        psm.removeObserver('titleScratch', psm, 'titleObserver');

        // Ensure that the PSM Publish Date selector resets
        psm.send('resetPubDate');

        this._super(...arguments);

        controller.set('cards' , []);
        controller.set('atoms' , []);
        controller.set('toolbar' , []);
        controller.set('apiRoot', ghostPaths().apiRoot);
        controller.set('assetPath', ghostPaths().assetRoot);

    },

    actions: {
        willTransition(transition) {
            // decorate the transition object so the editor.edit route
            // knows this was the previous active route
            transition.data.fromNew = true;

            this._super(...arguments);
        }
    }
});
