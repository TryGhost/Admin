import AdminRoute from 'ghost-admin/routes/admin';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';

export default class TierRoute extends AdminRoute {
    @service store;
    @service router;

    _requiresBackgroundRefresh = true;

    constructor() {
        super(...arguments);
        this.router.on('routeWillChange', (transition) => {
            this.showUnsavedChangesModal(transition);
        });
    }

    model(params) {
        if (params.tier_id) {
            return this.store.queryRecord('tier', {id: params.tier_id, include: 'stripe_prices'});
        } else {
            return this.store.createRecord('tier');
        }
    }

    setupController(controller, tier) {
        super.setupController(...arguments);
        if (this._requiresBackgroundRefresh) {
            if (tier.get('id')) {
                return this.store.queryRecord('tier', {id: tier.get('id'), include: 'stripe_prices'});
            }
        }
    }

    deactivate() {
        super.deactivate(...arguments);
        // clean up newly created records and revert unsaved changes to existing
        this.controller.tier.rollbackAttributes();
        this._requiresBackgroundRefresh = true;
    }

    @action
    save() {
        this.controller.save();
    }

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Settings - Tiers'
        };
    }

    showUnsavedChangesModal(transition) {
        if (transition.from && transition.from.name === this.routeName && transition.targetName) {
            let {controller} = this;

            // tier.changedAttributes is always true for new tiers but number of changed attrs is reliable
            let isChanged = Object.keys(controller.tier.changedAttributes()).length > 0;

            if (!controller.tier.isDeleted && isChanged) {
                transition.abort();
                controller.toggleUnsavedChangesModal(transition);
                return;
            }
        }
    }
}
