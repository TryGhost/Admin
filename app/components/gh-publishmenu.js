import Component from 'ember-component';
import computed, {reads} from 'ember-computed';
import injectService from 'ember-service/inject';
import {task} from 'ember-concurrency';
import $ from 'jquery';

export default Component.extend({
    clock: injectService(),

    classNames: 'gh-publishmenu',
    post: null,
    saveTask: null,

    _publishedAtBlogTZ: null,

    forcePublishedMenu: reads('post.pastScheduledTime'),

    postState: computed('post.{isPublished,isScheduled}', 'forcePublishedMenu', function () {
        if (this.get('forcePublishedMenu') || this.get('post.isPublished')) {
            return 'published';
        } else if (this.get('post.isScheduled')) {
            return 'scheduled';
        } else {
            return 'draft';
        }
    }),

    triggerText: computed('postState', function () {
        let state = this.get('postState');

        if (state === 'published') {
            return 'Update';
        } else if (state === 'scheduled') {
            return 'Scheduled';
        } else {
            return 'Publish';
        }
    }),

    buttonText: computed('postState', function () {
        let state = this.get('postState');

        return state === 'draft' ? 'Publish' : 'Update';
    }),

    save: task(function* () {
        this.get('setSaveType')(this.get('saveType'));

        try {
            // validate publishedAtBlog first to avoid an alert for displayed errors
            yield this.get('post').validate({property: 'publishedAtBlog'});

            // actual save will show alert for other failed validations
            let post = yield this.get('saveTask').perform();

            this._cachePublishedAtBlogTZ();
            return post;

        } catch (error) {
            // re-throw if we don't have a validation error
            if (error) {
                throw error;
            }
        }
    }),

    _cachePublishedAtBlogTZ() {
        this._publishedAtBlogTZ = this.get('post.publishedAtBlogTZ');
    },

    // when closing the menu we reset the publishedAtBlogTZ date so that the
    // unsaved changes made to the scheduled date aren't reflected in the PSM
    _resetPublishedAtBlogTZ() {
        this.get('post').set('publishedAtBlogTZ', this._publishedAtBlogTZ);
    },

    actions: {
        setSaveType(saveType) {
            let post = this.get('post');

            this.set('saveType', saveType);

            if (saveType === 'draft') {
                post.set('statusScratch', 'draft');
            } else if (saveType === 'schedule') {
                post.set('statusScratch', 'scheduled');
            } else if (saveType === 'publish') {
                post.set('statusScratch', 'published');
            }
        },

        open() {
            this._cachePublishedAtBlogTZ();
            this.get('post.errors').clear();
            this.get('onOpen')();
        },

        close(dropdown, e) {
            let post = this.get('post');

            // don't close the menu if the datepicker popup is clicked
            if (e && $(e.target).closest('.ember-power-datepicker-content').length) {
                return false;
            }

            // cleanup
            this._resetPublishedAtBlogTZ();
            post.set('statusScratch', null);
            post.validate();

            this.get('onClose')();
            return true;
        }
    }
});
