/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
import Ember from 'ember';
import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo, hasMany } from 'ember-data/relationships';
import ValidationEngine from 'ghost/mixins/validation-engine';

const {
    computed,
    inject: {service}
} = Ember;
const {equal} = computed;

export default Model.extend(ValidationEngine, {
    validationType: 'post',

    uuid: attr('string'),
    title: attr('string', {defaultValue: ''}),
    slug: attr('string'),
    markdown: attr('string', {defaultValue: ''}),
    html: attr('string'),
    image: attr('string'),
    featured: attr('boolean', {defaultValue: false}),
    page: attr('boolean', {defaultValue: false}),
    status: attr('string', {defaultValue: 'draft'}),
    language: attr('string', {defaultValue: 'en_US'}),
    metaTitle: attr('string'),
    metaDescription: attr('string'),
    author: belongsTo('user', {async: true}),
    authorId: attr('number'),
    updatedAt: attr('moment-utc'),
    updatedBy: attr(),
    publishedAt: attr('moment-utc'),
    publishedBy: belongsTo('user', {async: true}),
    createdAt: attr('moment-utc'),
    createdBy: attr(),
    tags: hasMany('tag', {
        embedded: 'always',
        async: false
    }),
    url: attr('string'),

    config: service(),
    ghostPaths: service(),
    timeZone: service(),

    absoluteUrl: computed('url', 'ghostPaths.url', 'config.blogUrl', function () {
        let blogUrl = this.get('config.blogUrl');
        let postUrl = this.get('url');
        return this.get('ghostPaths.url').join(blogUrl, postUrl);
    }),

    previewUrl: computed('uuid', 'ghostPaths.url', 'config.blogUrl', 'config.routeKeywords.preview', function () {
        let blogUrl = this.get('config.blogUrl');
        let uuid = this.get('uuid');
        let previewKeyword = this.get('config.routeKeywords.preview');
        // New posts don't have a preview
        if (!uuid) {
            return '';
        }
        return this.get('ghostPaths.url').join(blogUrl, previewKeyword, uuid);
    }),

    scratch: null,
    titleScratch: null,

    // Computed Date properties
    // timeZone.offset service returns the moment-timezone from the
    // activeTimezone, set in the blogs settings

    publishedAtOffset: computed('timeZone.offset', 'publishedAt', function() {
        let publishedAt = this.get('publishedAt');
        let momentPublishedAt = publishedAt ? moment(publishedAt) : moment.utc();

        return this.get('timeZone.offset').then((offset) => {
            return momentPublishedAt.tz(offset);
        });
    }),

    // Computed post properties

    isPublished: equal('status', 'published'),
    isDraft: equal('status', 'draft'),

    // remove client-generated tags, which have `id: null`.
    // Ember Data won't recognize/update them automatically
    // when returned from the server with ids.
    // https://github.com/emberjs/data/issues/1829
    updateTags() {
        let tags = this.get('tags');
        let oldTags = tags.filterBy('id', null);

        tags.removeObjects(oldTags);
        oldTags.invoke('deleteRecord');
    },

    isAuthoredByUser(user) {
        return parseInt(user.get('id'), 10) === parseInt(this.get('authorId'), 10);
    }

});
