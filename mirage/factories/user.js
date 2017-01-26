import {Factory} from 'ember-cli-mirage';

export default Factory.extend({
    accessibility: null,
    bio: null,
    cover: null,
    createdAt: '2015-09-02T13:41:50.000Z',
    createdBy: null,
    email(i) { return `user-${i}@example.com`; },
    image: '//www.gravatar.com/avatar/3ae045bc198a157401827c8455cd7c99?s=250&d=mm&r=x',
    language: 'en_US',
    lastLogin: '2015-11-02T16:12:05.000Z',
    location: null,
    metaDescription: null,
    metaTitle: null,
    name(i) { return `User ${i}`; },
    slug(i) { return `user-${i}`; },
    status: 'active',
    tour: null,
    updatedAt: '2015-11-02T16:12:05.000Z',
    updatedBy: '2015-09-02T13:41:50.000Z',
    website: 'http://example.com',
    roles: []
});
