import Controller, {inject as controller} from '@ember/controller';
import {alias, equal, sort} from '@ember/object/computed';
import {computed} from '@ember/object';
import {run} from '@ember/runloop';

export default Controller.extend({

    tagController: controller('settings.tags.tag'),

    tags: alias('model'),
    selectedTag: alias('tagController.tag'),

    tagListFocused: equal('keyboardFocus', 'tagList'),
    tagContentFocused: equal('keyboardFocus', 'tagContent'),

    filteredTags: computed('tags.@each.isNew', function () {
        return this.tags.filterBy('isNew', false);
    }),

    // tags are sorted by name
    sortedTags: sort('filteredTags', function (tagA, tagB) {
        return tagA.name.localeCompare(tagB.name);
    }),

    actions: {
        leftMobile() {
            let firstTag = this.get('tags.firstObject');
            // redirect to first tag if possible so that you're not left with
            // tag settings blank slate when switching from portrait to landscape
            if (firstTag && !this.get('tagController.tag')) {
                this.transitionToRoute('settings.tags.tag', firstTag);
            }
        }
    },

    scrollTagIntoView(tag) {
        run.scheduleOnce('afterRender', this, function () {
            let id = `#gh-tag-${tag.get('id')}`;
            let element = document.querySelector(id);

            if (element) {
                let scroll = document.querySelector('.tag-list');
                let {scrollTop} = scroll;
                let scrollHeight = scroll.offsetHeight;
                let element = document.querySelector(id);
                let elementTop = element.offsetTop;
                let elementHeight = element.offsetHeight;

                if (elementTop < scrollTop) {
                    element.scrollIntoView(true);
                }

                if (elementTop + elementHeight > scrollTop + scrollHeight) {
                    element.scrollIntoView(false);
                }
            }
        });
    }
});
