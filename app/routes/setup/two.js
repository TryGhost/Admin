import Route from 'ember-route';
import getOwner from 'ember-owner/get';

import SetupModel from 'ghost-admin/models/setup';

export default Route.extend({
    _model: null,

    init() {
        this.set('_model', SetupModel.create(getOwner(this).ownerInjection()));
    },

    model() {
        return this.get('_model');
    }
});
