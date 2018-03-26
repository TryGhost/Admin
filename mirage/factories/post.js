import {Factory, faker} from 'ember-cli-mirage';

export default Factory.extend({
    codeinjectionFoot: null,
    codeinjectionHead: null,
    createdAt: '2015-09-11T09:44:29.871Z',
    createdBy: 1,
    customExcerpt: null,
    customTemplate: null,
    description(i) { return `Title for post ${i}.`; },
    featured: false,
    featureImage(i) { return `/content/images/2015/10/post-${i}.jpg`; },
    html(i) { return `<p>HTML for post ${i}.</p>`; },
    locale: null,
    metaDescription(i) { return `Meta description for post ${i}.`; },
    metaTitle(i) { return `Meta Title for post ${i}`; },
    ogDescription: null,
    ogImage: null,
    ogTitle: null,
    page: false,
    plaintext(i) { return `Plaintext for post ${i}.`; },
    publishedAt: '2015-12-19T16:25:07.000Z',
    publishedBy: 1,
    slug(i) { return `post-${i}`; },
    status(i) { return faker.list.cycle('draft', 'published', 'scheduled')(i); },
    tags() { return []; },
    title(i) { return `Post ${i}`; },
    twitterDescription: null,
    twitterImage: null,
    twitterTitle: null,
    updatedAt: '2015-10-19T16:25:07.756Z',
    updatedBy: 1,
    uuid(i) { return `post-${i}`; }
});
