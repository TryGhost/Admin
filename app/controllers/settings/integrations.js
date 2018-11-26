/* eslint-disable ghost/ember/alias-model-in-controller */
import Controller from '@ember/controller';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Controller.extend({
    settings: service(),
    store: service(),

    _allIntegrations: null,

    init() {
        this._super(...arguments);
        this._allIntegrations = this.store.peekAll('integration');
    },

    // filter over the live query so that the list is automatically updated
    // as integrations are added/removed
    integrations: computed('_allIntegrations.@each.isNew', function () {
        return this._allIntegrations.rejectBy('isNew', true);
    }),

    // use ember-concurrency so that we can use the derived state to show
    // a spinner only in the integrations list and avoid delaying the whole
    // screen display
    fetchIntegrations: task(function* () {
        return yield this.store.findAll('integration');
    })
});
