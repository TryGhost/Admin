import Component from '@ember/component';
import EmailFailedError from 'ghost-admin/errors/email-failed-error';
import {action} from '@ember/object';
import {computed} from '@ember/object';
import {or, reads} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task, timeout} from 'ember-concurrency';

const CONFIRM_EMAIL_POLL_LENGTH = 1000;
const CONFIRM_EMAIL_MAX_POLL_LENGTH = 15 * 1000;

export default Component.extend({
    clock: service(),
    feature: service(),
    settings: service(),
    config: service(),
    session: service(),
    store: service(),

    backgroundTask: null,
    classNames: 'gh-publishmenu',
    displayState: 'draft',
    post: null,
    postStatus: 'draft',
    runningText: null,
    saveTask: null,
    sendEmailWhenPublished: 'none',
    typedDateError: null,

    _publishedAtBlogTZ: null,
    _previousStatus: null,

    isClosing: null,

    onClose() {},

    forcePublishedMenu: reads('post.pastScheduledTime'),

    hasEmailPermission: or('session.user.isOwner', 'session.user.isAdmin', 'session.user.isEditor'),

    canSendEmail: computed('post.{isPost,email}', 'settings.{mailgunApiKey,mailgunDomain,mailgunBaseUrl}', 'config.mailgunIsConfigured', function () {
        let mailgunIsConfigured = this.get('settings.mailgunApiKey') && this.get('settings.mailgunDomain') && this.get('settings.mailgunBaseUrl') || this.get('config.mailgunIsConfigured');
        let isPost = this.post.isPost;
        let hasSentEmail = !!this.post.email;

        return mailgunIsConfigured && isPost && !hasSentEmail;
    }),

    postState: computed('post.{isPublished,isScheduled}', 'forcePublishedMenu', function () {
        if (this.forcePublishedMenu || this.get('post.isPublished')) {
            return 'published';
        } else if (this.get('post.isScheduled')) {
            return 'scheduled';
        } else {
            return 'draft';
        }
    }),

    triggerText: computed('postState', function () {
        let state = this.postState;

        if (state === 'published') {
            return 'Update';
        } else if (state === 'scheduled') {
            return 'Scheduled';
        } else {
            return 'Publish';
        }
    }),

    _runningText: computed('postState', 'saveType', function () {
        let saveType = this.saveType;
        let postState = this.postState;
        let runningText;

        if (postState === 'draft') {
            runningText = saveType === 'publish' ? 'Publishing' : 'Scheduling';
        }

        if (postState === 'published') {
            runningText = saveType === 'publish' ? 'Updating' : 'Unpublishing';
        }

        if (postState === 'scheduled') {
            runningText = saveType === 'schedule' ? 'Rescheduling' : 'Unscheduling';
        }

        return runningText || 'Publishing';
    }),

    buttonText: computed('postState', 'saveType', function () {
        let saveType = this.saveType;
        let postState = this.postState;
        let buttonText;

        if (postState === 'draft') {
            buttonText = saveType === 'publish' ? 'Publish' : 'Schedule';
        }

        if (postState === 'published') {
            buttonText = saveType === 'publish' ? 'Update' : 'Unpublish';
        }

        if (postState === 'scheduled') {
            buttonText = saveType === 'schedule' ? 'Reschedule' : 'Unschedule';
        }

        return buttonText || 'Publish';
    }),

    successText: computed('_previousStatus', 'postState', function () {
        let postState = this.postState;
        let previousStatus = this._previousStatus;
        let buttonText;

        if (previousStatus === 'draft') {
            buttonText = postState === 'published' ? 'Published' : 'Scheduled';
        }

        if (previousStatus === 'published') {
            buttonText = postState === 'draft' ? 'Unpublished' : 'Updated';
        }

        if (previousStatus === 'scheduled') {
            buttonText = postState === 'draft' ? 'Unscheduled' : 'Rescheduled';
        }

        return buttonText;
    }),

    didReceiveAttrs() {
        this._super(...arguments);

        // update the displayState based on the post status but only after a
        // save has finished to avoid swapping the menu prematurely and triggering
        // calls to `setSaveType` due to the component re-rendering
        // TODO: we should have a better way of dealing with this where we don't
        // rely on the side-effect of component rendering calling setSaveType
        let postStatus = this.postStatus;
        if (postStatus !== this._postStatus) {
            if (this.get('saveTask.isRunning')) {
                this.get('saveTask.last').then(() => {
                    this.set('displayState', postStatus);
                });
            } else {
                this.set('displayState', postStatus);
            }
        }

        this._postStatus = this.postStatus;
        if (this.postStatus === 'draft' && this.canSendEmail && this.hasEmailPermission) {
            // Set default newsletter recipients
            if (this.post.visibility === 'public' || this.post.visibility === 'members') {
                this.set('sendEmailWhenPublished', 'all');
            } else {
                this.set('sendEmailWhenPublished', 'paid');
            }
        }
        this.countPaidMembers();
    },

    actions: {
        setSaveType(saveType) {
            let post = this.post;

            this.set('saveType', saveType);

            if (saveType === 'draft') {
                post.set('statusScratch', 'draft');
            } else if (saveType === 'schedule') {
                post.set('statusScratch', 'scheduled');
            } else if (saveType === 'publish') {
                post.set('statusScratch', 'published');
            }
        },

        setSendEmailWhenPublished(sendEmailWhenPublished) {
            this.set('sendEmailWhenPublished', sendEmailWhenPublished);
        },

        open() {
            this._cachePublishedAtBlogTZ();
            this.set('isClosing', false);
            this.get('post.errors').clear();
            if (this.onOpen) {
                this.onOpen();
            }
        },

        close(dropdown, e) {
            // don't close the menu if the datepicker popup or confirm modal is clicked
            if (e) {
                let onDatepicker = !!e.target.closest('.ember-power-datepicker-content');
                let onModal = !!e.target.closest('.fullscreen-modal-container');

                if (onDatepicker || onModal) {
                    return false;
                }
            }

            if (!this._skipDropdownCloseCleanup) {
                this._cleanup();
            }
            this._skipDropdownCloseCleanup = false;

            this.onClose();
            this.set('isClosing', true);

            return true;
        }
    },

    countPaidMembers: action(function () {
        // TODO: remove editor conditional once editors can query member counts
        if (!this.session.get('user.isEditor') && this.canSendEmail) {
            this.countPaidMembersTask.perform();
        }
    }),

    countPaidMembersTask: task(function* () {
        const result = yield this.store.query('member', {filter: 'subscribed:true', paid: true, limit: 1, page: 1});
        const paidMemberCount = result.meta.pagination.total;
        const freeMemberCount = this.memberCount - paidMemberCount;
        this.set('paidMemberCount', paidMemberCount);
        this.set('freeMemberCount', freeMemberCount);

        if (this.postStatus === 'draft' && this.canSendEmail && this.hasEmailPermission) {
            // Set default newsletter recipients
            if (this.post.visibility === 'public' || this.post.visibility === 'members') {
                if (paidMemberCount > 0 && freeMemberCount > 0) {
                    this.set('sendEmailWhenPublished', 'all');
                } else if (!paidMemberCount && freeMemberCount > 0) {
                    this.set('sendEmailWhenPublished', 'free');
                } else if (!freeMemberCount && paidMemberCount > 0) {
                    this.set('sendEmailWhenPublished', 'paid');
                } else if (!freeMemberCount && !paidMemberCount) {
                    this.set('sendEmailWhenPublished', 'none');
                }
            } else {
                const type = paidMemberCount > 0 ? 'paid' : 'none';
                this.set('sendEmailWhenPublished', type);
            }
        }
    }),

    // action is required because <GhFullscreenModal> only uses actions
    confirmEmailSend: action(function () {
        return this._confirmEmailSend.perform();
    }),

    _confirmEmailSend: task(function* () {
        this.sendEmailConfirmed = true;
        let post = yield this.save.perform();

        // simulate a validation error if saving failed so that the confirm
        // modal can react accordingly
        if (!post || post.errors.length) {
            throw null;
        }

        let pollTimeout = 0;
        if (post.email && post.email.status !== 'submitted') {
            while (pollTimeout < CONFIRM_EMAIL_MAX_POLL_LENGTH) {
                yield timeout(CONFIRM_EMAIL_POLL_LENGTH);
                post = yield post.reload();

                if (post.email.status === 'submitted') {
                    break;
                }
                if (post.email.status === 'failed') {
                    throw new EmailFailedError(post.email.error);
                }
            }
        }

        return post;
    }),

    retryEmailSend: action(function () {
        return this._retryEmailSend.perform();
    }),

    _retryEmailSend: task(function* () {
        if (!this.post.email) {
            return;
        }

        let email = yield this.post.email.retry();

        let pollTimeout = 0;
        if (email && email.status !== 'submitted') {
            while (pollTimeout < CONFIRM_EMAIL_POLL_LENGTH) {
                yield timeout(CONFIRM_EMAIL_POLL_LENGTH);
                email = yield email.reload();

                if (email.status === 'submitted') {
                    break;
                }
                if (email.status === 'failed') {
                    throw new EmailFailedError(email.error);
                }
            }
        }

        return email;
    }),

    openEmailConfirmationModal: action(function (dropdown) {
        if (dropdown) {
            this._skipDropdownCloseCleanup = true;
            dropdown.actions.close();
        }
        this.set('showEmailConfirmationModal', true);
    }),

    closeEmailConfirmationModal: action(function () {
        this.set('showEmailConfirmationModal', false);
        this._cleanup();
    }),

    save: task(function* ({dropdown} = {}) {
        let {
            post,
            sendEmailWhenPublished,
            sendEmailConfirmed,
            saveType,
            typedDateError
        } = this;

        // don't allow save if an invalid schedule date is present
        if (typedDateError) {
            return false;
        }

        // validate publishedAtBlog to avoid an alert when saving for already displayed errors
        // important to do this before opening email confirmation modal too
        try {
            yield post.validate({property: 'publishedAtBlog'});
        } catch (error) {
            // re-throw if we don't have a validation error
            if (error) {
                throw error;
            }
            return false;
        }

        if (
            post.status === 'draft' &&
            !post.email && // email sent previously
            sendEmailWhenPublished && sendEmailWhenPublished !== 'none' &&
            !sendEmailConfirmed // set once confirmed so normal save happens
        ) {
            this.openEmailConfirmationModal(dropdown);
            return;
        }

        this.sendEmailConfirmed = false;

        // runningText needs to be declared before the other states change during the
        // save action.
        this.set('runningText', this._runningText);
        this.set('_previousStatus', this.get('post.status'));
        this.setSaveType(saveType);

        try {
            // will show alert for non-date related failed validations
            post = yield this.saveTask.perform({sendEmailWhenPublished});

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

    _cleanup() {
        this.set('showConfirmEmailModal', false);

        // when closing the menu we reset the publishedAtBlogTZ date so that the
        // unsaved changes made to the scheduled date aren't reflected in the PSM
        this.post.set('publishedAtBlogTZ', this._publishedAtBlogTZ);

        this.post.set('statusScratch', null);
        this.post.validate();
    }
});
