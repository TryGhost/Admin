import Ember from 'ember';

const {Controller, computed} = Ember;
const {alias} = computed;

export default Controller.extend({

    newOld: alias('model'),

    title: computed('newOld', function () {
        let newOld = this.get('newOld').classify();

        return `${newOld} editor`;
    }),

    confirm: {
        accept: {
            text: 'OK',
            buttonClass: 'btn btn-default btn-minor'
        }
    },

    actions: {
        confirmAccept: Ember.K
    }

});
