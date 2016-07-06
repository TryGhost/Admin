import Route from 'ember-route';
import getOwner from 'ember-owner/get';

import SetupModel from 'ghost-admin/models/setup';

export default Route.extend({
    model() {
        return SetupModel.create(getOwner(this).ownerInjection());
    }
});
