import AdminRoute from 'ghost-admin/routes/admin';
import {inject as service} from '@ember/service';

export default class TiersRoute extends AdminRoute {
    @service store;

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Settings - Tiers'
        };
    }

    model() {
        return this.store.findAll('tier', {include: 'stripe_prices'});
    }
}
