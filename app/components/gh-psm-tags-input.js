import Component from '@ember/component';
import {computed} from '@ember/object';
import {guidFor} from '@ember/object/internals';
import {inject as service} from '@ember/service';

export default Component.extend({

    store: service(),

    // public attrs
    post: null,

    // live-query of all tags for tag input autocomplete
    availableTags: computed(function () {
        return this.get('store').filter('tag', {limit: 'all'}, () => true);
    }),

    actions: {
        addTag(tagName, index) {
            let currentTags = this.get('post.tags');
            let currentTagNames = currentTags.map((tag) => {
                return tag.get('name').toLowerCase();
            });
            let availableTagNames,
                tagToAdd;

            tagName = tagName.trim();

            // abort if tag is already selected
            if (currentTagNames.includes(tagName.toLowerCase())) {
                return;
            }

            this.get('availableTags').then((availableTags) => {
                availableTagNames = availableTags.map((tag) => {
                    return tag.get('name').toLowerCase();
                });

                // find existing tag or create new
                if (availableTagNames.includes(tagName.toLowerCase())) {
                    tagToAdd = availableTags.find((tag) => {
                        return tag.get('name').toLowerCase() === tagName.toLowerCase();
                    });
                } else {
                    tagToAdd = this.get('store').createRecord('tag', {
                        name: tagName
                    });

                    // we need to set a UUID so that selectize has a unique value
                    // it will be ignored when sent to the server
                    // TODO: uuid not needed once moved to EPS
                    tagToAdd.set('uuid', guidFor(tagToAdd));
                }

                // push tag onto post relationship
                if (tagToAdd) {
                    this.get('post.tags').insertAt(index, tagToAdd);
                }
            });
        },

        removeTag(tag) {
            this.get('post.tags').removeObject(tag);

            if (tag.get('isNew')) {
                tag.destroyRecord();
            }
        }
    }
});
