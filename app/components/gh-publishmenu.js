import $ from 'jquery';
import Component from '@ember/component';
import {computed} from '@ember/object';
import {reads} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Component.extend({
    clock: service(),
    i18n: service(),

    classNames: 'gh-publishmenu',
    displayState: 'draft',
    post: null,
    postStatus: 'draft',
    saveTask: null,
    runningText: null,

    _publishedAtBlogTZ: null,
    _previousStatus: null,

    isClosing: null,

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
            return this.get('i18n').t('trigger.Update');
        } else if (state === 'scheduled') {
            return this.get('i18n').t('trigger.Scheduled');
        } else {
            return this.get('i18n').t('trigger.Publish');
        }
    }),

    _runningText: computed('postState', 'saveType', function () {
        let saveType = this.get('saveType');
        let postState = this.get('postState');
        let runningText;

        if (postState === 'draft') {
            runningText = saveType === 'publish' ? 'taskButton.Publishing' : 'taskButton.Scheduling';
        }

        if (postState === 'published') {
            runningText = saveType === 'publish' ? 'taskButton.Updating' : 'taskButton.Unpublishing';
        }

        if (postState === 'scheduled') {
            runningText = saveType === 'schedule' ? 'taskButton.Rescheduling' : 'taskButton.Unscheduling';
        }

        return this.get('i18n').t(runningText || 'taskButton.Publishing').toString();
    }),

    buttonText: computed('postState', 'saveType', function () {
        let saveType = this.get('saveType');
        let postState = this.get('postState');
        let buttonText;

        if (postState === 'draft') {
            buttonText = saveType === 'publish' ? 'taskButton.Publish' : 'taskButton.Schedule';
        }

        if (postState === 'published') {
            buttonText = saveType === 'publish' ? 'taskButton.Update' : 'taskButton.Unpublish';
        }

        if (postState === 'scheduled') {
            buttonText = saveType === 'schedule' ? 'taskButton.Reschedule' : 'taskButton.Unschedule';
        }

        return this.get('i18n').t(buttonText || 'taskButton.Publish').toString();
    }),

    successText: computed('_previousStatus', 'postState', function () {
        let postState = this.get('postState');
        let previousStatus = this.get('_previousStatus');
        let buttonText;

        if (previousStatus === 'draft') {
            buttonText = postState === 'published' ? 'taskButton.Published' : 'taskButton.Scheduled';
        }

        if (previousStatus === 'published') {
            buttonText = postState === 'draft' ? 'taskButton.Unpublished' : 'taskButton.Updated';
        }

        if (previousStatus === 'scheduled') {
            buttonText = postState === 'draft' ? 'taskButton.Unscheduled' : 'taskButton.Rescheduled';
        }

        return this.get('i18n').t(buttonText || 'taskButton.Published').toString();
    }),

    didReceiveAttrs() {
        this._super(...arguments);

        // update the displayState based on the post status but only after a
        // save has finished to avoid swapping the menu prematurely and triggering
        // calls to `setSaveType` due to the component re-rendering
        // TODO: we should have a better way of dealing with this where we don't
        // rely on the side-effect of component rendering calling setSaveType
        let postStatus = this.get('postStatus');
        if (postStatus !== this._postStatus) {
            if (this.get('saveTask.isRunning')) {
                this.get('saveTask.last').then(() => {
                    this.set('displayState', postStatus);
                });
            } else {
                this.set('displayState', postStatus);
            }
        }

        this._postStatus = this.get('postStatus');
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
            this.set('isClosing', false);
            this.get('post.errors').clear();
            if (this.get('onOpen')) {
                this.get('onOpen')();
            }
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

            if (this.get('onClose')) {
                this.get('onClose')();
            }

            this.set('isClosing', true);

            return true;
        }
    },

    save: task(function* () {
        // runningText needs to be declared before the other states change during the
        // save action.
        this.set('runningText', this.get('_runningText'));
        this.set('_previousStatus', this.get('post.status'));
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
    }
});
