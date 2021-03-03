import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    billing: service(),
    ui: service(),

    queryParams: {
        action: {refreshModel: true}
    },

    beforeModel(transition) {
        this._super(...arguments);
        this.billing.set('previousTransition', transition);
    },

    model(params) {
        if (params.action) {
            this.billing.set('action', params.action);
        }

        this.billing.setBillingWindowOpen(true);
    },

    activate() {
        this.ui.set('showTour', false);
    },

    deactivate() {
        this.ui.set('showTour', true);
    },

    actions: {
        willTransition(transition) {
            let isBillingTransition = false;

            if (transition) {
                let destinationUrl = (typeof transition.to === 'string')
                    ? transition.to
                    : (transition.intent
                        ? transition.intent.url
                        : '');

                if (destinationUrl?.includes('/billing')) {
                    isBillingTransition = true;
                }
            }

            this.billing.setBillingWindowOpen(isBillingTransition);
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Billing'
        };
    }
});
