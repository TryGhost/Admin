import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

export default class ProductRoute extends AuthenticatedRoute {
    @service store

    model(params) {
        if (params.product_id) {
            return this.store.queryRecord('product', {id: params.product_id, include: 'stripe_prices'});
        } else {
            return this.store.createRecord('product');
        }
    }

    beforeModel() {
        super.beforeModel(...arguments);
        return this.session.user.then((user) => {
            if (!user.isOwnerOrAdmin) {
                return this.transitionTo('home');
            }
        });
    }

    @action
    save() {
        this.controller.save();
    }

    actions = {
        willTransition(transition) {
            return this.controller.leaveRoute(transition);
        }
    }

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Settings - Products'
        };
    }
}
