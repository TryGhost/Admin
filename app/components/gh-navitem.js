import Component from 'ember-component';
import computed, {alias, bool} from 'ember-computed';
import run from 'ember-runloop';
import SortableItem from 'ember-sortable/mixins/sortable-item';
import {invokeAction} from 'ember-invoke-action';

export default Component.extend(SortableItem, {
    classNames: 'gh-blognav-item',
    classNameBindings: ['errorClass', 'navItem.isNew::gh-blognav-item--sortable'],

    new: false,
    handle: '.gh-blognav-grab',

    model: alias('navItem'),
    hasError: bool('model.changeset.errors.length'),

    errorClass: computed('hasError', function () {
        if (this.get('hasError')) {
            return 'gh-blognav-item--error';
        }
    }),

    keyPress(event) {
        // enter key
        if (event.keyCode === 13 && this.get('navItem.isNew')) {
            event.preventDefault();
            run.scheduleOnce('actions', this, function () {
                this.send('addItem');
            });
        }
    },

    actions: {
        addItem() {
            invokeAction(this, 'addItem');
        },

        deleteItem(item) {
            invokeAction(this, 'deleteItem', item);
        }
    }
});
