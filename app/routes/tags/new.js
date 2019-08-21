import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({

    router: service(),

    controllerName: 'tags.tag',

    init() {
        this._super(...arguments);
        this.router.on('routeWillChange', (transition) => {
            this.showUnsavedChangesModal(transition);
        });
    },

    model() {
        return this.store.createRecord('tag');
    },

    renderTemplate() {
        this.render('tags.tag');
    },

    // reset the model so that mobile screens react to an empty selectedTag
    deactivate() {
        this._super(...arguments);

        let {controller} = this;
        controller.model.rollbackAttributes();
        controller.set('model', null);
    },

    showUnsavedChangesModal(transition) {
        if (transition.from && transition.from.name.match(/^tags\.new/) && transition.targetName) {
            let {controller} = this;

            if (!controller.tag.isDeleted && controller.tag.hasDirtyAttributes) {
                transition.abort();
                controller.send('toggleUnsavedChangesModal', transition);
                return;
            }
        }
    }

});
