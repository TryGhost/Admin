import Ember from 'ember';
import Controller from 'ember-controller';
import computed from 'ember-computed';
import injectService from 'ember-service/inject';

const {compare} = Ember;

export default Controller.extend({

    queryParams: ['type'],
    type: null,

    session: injectService(),

    showDeletePostModal: false,

    sortedPosts: computed('model.@each.{status,publishedAtUTC,isNew,updatedAtUTC}', function () {
        return this.get('model').toArray().sort(compare);
    }),

    actions: {
        toggleDeletePostModal() {
            this.toggleProperty('showDeletePostModal');
        }
    }
});
