import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import RSVP from 'rsvp';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    feature: service(),

    titleToken: 'Subscribers',

    // redirect if subscribers is disabled or user isn't owner/admin
    beforeModel() {
        this._super(...arguments);
        let promises = {
            user: this.get('session.user'),
            subscribers: this.get('feature.subscribers')
        };

        return RSVP.hash(promises).then((hash) => {
            let {user, subscribers} = hash;

            if (!subscribers || !user.isOwnerOrAdmin) {
                return this.transitionTo('home');
            }
        });
    },

    setupController(controller) {
        this._super(...arguments);
        controller.fetchSubscribers.perform();
    },

    actions: {
        addSubscriber(subscriber) {
            this.controller.send('addSubscriber', subscriber);
        }
    }
});
