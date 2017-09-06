import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {inject as injectService} from '@ember/service';

export default AuthenticatedRoute.extend({
    titleToken: 'Subscribers',

    feature: injectService(),

    // redirect if subscribers is disabled or user isn't owner/admin
    beforeModel() {
        this._super(...arguments);

        return this.get('session.user').then((user) => {
            if (!(user.get('isOwner') || user.get('isAdmin'))) {
                return this.transitionTo('posts');
            }
        });
    },

    setupController(controller) {
        this._super(...arguments);
        controller.initializeTable();
        controller.send('loadFirstPage');
    },

    resetController(controller, isExiting) {
        this._super(...arguments);
        if (isExiting) {
            controller.set('order', 'created_at');
            controller.set('direction', 'desc');
        }
    },

    actions: {
        addSubscriber(subscriber) {
            this.get('controller').send('addSubscriber', subscriber);
        },

        reset() {
            this.get('controller').send('reset');
        }
    }
});
