import Component from 'ember-component';
import injectService from 'ember-service/inject';
import computed from 'ember-computed';
import {bind} from 'ember-runloop';
import {isBlank} from 'ember-utils';

export default Component.extend({
    classNames: 'form-group',

    store: injectService(),

    // live-query of all tags for tag input autocomplete
    availableTags: computed(function () {
        return this.get('store').filter('tag', {limit: 'all'}, () => true);
    }),

    didInsertElement() {
        this._super(...arguments);
        this._createSortable();
    },

    willDestroyElement() {
        this._super(...arguments);
        this._destroySortable();
    },

    _createSortable() {
        if (!this._sortable) {
            let sortElement = this.$('.ember-power-select-multiple-options');

            this._sortable = sortElement.sortable({
                update: bind(this, this._reorderTag),
                scroll: false,
                items: '> .ember-power-select-multiple-option',
                cancel: 'span.ember-power-select-multiple-remove-btn'
            }).sortable.bind(sortElement);
        }
    },

    _destroySortable() {
        if (this._sortable) {
            this._sortable('destroy');
            this._sortable = null;
        }
    },

    _reorderTag(e, {item}) {
        let tags = this.get('tags').toArray();

        let start = item.children('span[data-selected-index]').data('selected-index');
        let end = item.index();

        // If the starting index is less than the ending index, we need to decrement the
        // end index as we will be shortening the array by 1
        if (start < end) {
            end--;
        }

        let obj = tags.objectAt(start);
        tags.removeAt(start).insertAt(end, obj);

        this.send('updateTags', tags);
    },

    actions: {
        // @TODO: fix , and tab handling
        handleInput(select, {keyCode}) {
            let tags = this.get('tags').toArray();

            // Delete last tag if backspace
            if (isBlank(select.searchText)) {
                if (keyCode === 8) {
                    tags.popObject();
                    this.send('updateTags', tags);
                    return false;
                } else if (keyCode === 32) {
                    return false;
                }

                return true;
            }

            // If select is active and the user presses enter, comma, or tab
            if ([13, 9, 188].includes(keyCode) && select.isActive) {
                let tagName = select.searchText.trim();

                // abort if tag is already selected
                if (this.get('tags').includes((tag) => tag.get('name').toLowerCase() === tagName.toLowerCase())) {
                    return false;
                }

                this.get('availableTags').then((availableTags) => {
                    let existingTag = availableTags.find((tag) => tag.get('name').toLowerCase() === tagName.toLowerCase());

                    let tagToAdd = existingTag || this.get('store').createRecord('tag', {
                        name: tagName
                    });

                    select.actions.choose(tagToAdd);
                });

                return false;
            }
        },

        updateTags(tags) {
            let currentTags = this.get('tags');

            if (tags.length < currentTags.length) {
                // tag was removed, find the tag that was changed
                // EPS only adds or removes one tag at a time, which is why this works
                let removed = currentTags.find((tag) => !tags.includes(tag));

                // If the removed tag is new, delete it
                if (removed.get('isNew')) {
                    currentTags.removeObject(removed);
                    removed.destroyRecord();
                    this._sortable('refresh');
                    return;
                }
            }

            this.set('tags', tags);
        }
    }
});
