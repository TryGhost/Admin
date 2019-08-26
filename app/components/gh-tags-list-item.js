import $ from 'jquery';
import Component from '@ember/component';
import {alias} from '@ember/object/computed';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Component.extend({
    ghostPaths: service(),
    notifications: service(),
    router: service(),

    tagName: 'li',
    classNames: ['gh-list-row', 'gh-tags-list-item'],
    classNameBindings: ['active'],

    active: false,

    // closure actions
    onClick() {},
    onDoubleClick() {},

    id: alias('tag.id'),
    slug: alias('tag.slug'),
    name: alias('tag.name'),
    isInternal: alias('tag.isInternal'),
    description: alias('tag.description'),
    postsCount: alias('tag.count.posts'),
    postsLabel: computed('tag.count.posts', function () {
        let noOfPosts = this.postsCount || 0;
        return (noOfPosts === 1) ? `${noOfPosts} post` : `${noOfPosts} posts`;
    }),

    didReceiveAttrs() {
        if (this.active) {
            this.scrollIntoView();
        }
    },

    click() {
        this.onClick(this.tag);
    },

    doubleClick() {
        this.onDoubleClick(this.tag);
    },

    scrollIntoView() {
        let element = this.$();
        let offset = element.offset().top;
        let elementHeight = element.height();
        let container = $('.content-list');
        let containerHeight = container.height();
        let currentScroll = container.scrollTop();
        let isBelowTop, isAboveBottom, isOnScreen;

        isAboveBottom = offset < containerHeight;
        isBelowTop = offset > elementHeight;

        isOnScreen = isBelowTop && isAboveBottom;

        if (!isOnScreen) {
            // Scroll so that element is centered in container
            // 40 is the amount of padding on the container
            container.clearQueue().animate({
                scrollTop: currentScroll + offset - 40 - containerHeight / 2
            });
        }
    },
    _deleteTag() {
        let tag = this.tag;

        return tag.destroyRecord().then(() => {}, (error) => {
            this._deleteTagFailure(error);
        });
    },

    _deleteTagFailure(error) {
        this.notifications.showAPIError(error, {key: 'tag.delete'});
    }
});
