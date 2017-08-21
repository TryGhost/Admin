import Component from 'ember-component';
import computed, {mapBy} from 'ember-computed';
import {invokeAction} from 'ember-invoke-action';

export default Component.extend({
    classNames: ['form-group', 'for-select'],

    activeList: null,
    availableLists: null,

    availableListIds: mapBy('availableLists', 'id'),

    hasListOverride: computed('activeList', 'availableListIds', function () {
        let activeList = this.get('activeList.id');
        let availableListIds = this.get('availableListIds');

        return !availableListIds.includes(activeList);
    }),

    selectedList: computed('activeList', 'availableLists', 'hasListOverride', function () {
        let hasListOverride = this.get('hasListOverride');
        let activeList = this.get('activeList.id');
        let availableLists = this.get('availableLists');

        if (hasListOverride) {
            return {id: '', name: ''};
        }

        return availableLists
            .filterBy('id', activeList)
            .get('firstObject');
    }),

    selectableLists: computed('availableLists', 'hasListOverride', function () {
        let hasListOverride = this.get('hasListOverride');
        let availableLists = this.get('availableLists');

        if (hasListOverride) {
            return [{id: '', name: ''}, ...availableLists];
        }

        return availableLists;
    }),

    actions: {
        setList(list) {
            invokeAction(this, 'update', list);
        }
    }
});
