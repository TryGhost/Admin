import Route from 'ember-route';
import SetupModel from 'ghost-admin/models/setup';

export default Route.extend({
    model() {
        return SetupModel.create();
    }
});
