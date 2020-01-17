import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import {action, computed, get} from '@ember/object';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';

const TYPES = [{
    name: 'All posts',
    value: null
}, {
    name: 'Draft posts',
    value: 'draft'
}, {
    name: 'Published posts',
    value: 'published'
}, {
    name: 'Scheduled posts',
    value: 'scheduled'
}, {
    name: 'Featured posts',
    value: 'featured'
}];

const ORDERS = [{
    name: 'Newest',
    value: null
}, {
    name: 'Oldest',
    value: 'published_at asc'
}, {
    name: 'Recently updated',
    value: 'updated_at desc'
}];

@classic
export default class PostsController extends Controller {
    @service store;

    queryParams = ['type', 'author', 'tag', 'order'];
    type = null;
    author = null;
    tag = null;
    order = null;
    _hasLoadedTags = false;
    _hasLoadedAuthors = false;
    availableTypes = null;
    availableOrders = null;

    init() {
        super.init(...arguments);
        this.availableTypes = TYPES;
        this.availableOrders = ORDERS;
    }

    @alias('model')
    postsInfinityModel;

    @computed('type', 'author', 'tag')
    get showingAll() {
        let {type, author, tag} = this.getProperties(['type', 'author', 'tag']);

        return !type && !author && !tag;
    }

    @computed('type')
    get selectedType() {
        let types = this.get('availableTypes');
        return types.findBy('value', this.get('type'));
    }

    @computed('order')
    get selectedOrder() {
        let orders = this.get('availableOrders');
        return orders.findBy('value', this.get('order'));
    }

    @computed
    get _availableTags() {
        return this.get('store').peekAll('tag');
    }

    @computed('_availableTags.[]')
    get availableTags() {
        let tags = this.get('_availableTags')
            .filter(tag => tag.get('id') !== null)
            .sort((tagA, tagB) => tagA.name.localeCompare(tagB.name, undefined, {ignorePunctuation: true}));
        let options = tags.toArray();

        options.unshiftObject({name: 'All tags', slug: null});

        return options;
    }

    @computed('tag', '_availableTags.[]')
    get selectedTag() {
        let tag = this.get('tag');
        let tags = this.get('availableTags');

        return tags.findBy('slug', tag);
    }

    @computed
    get _availableAuthors() {
        return this.get('store').peekAll('user');
    }

    @computed('_availableAuthors.[]')
    get availableAuthors() {
        let authors = this.get('_availableAuthors');
        let options = authors.toArray();

        options.unshiftObject({name: 'All authors', slug: null});

        return options;
    }

    @computed('author', 'availableAuthors.[]')
    get selectedAuthor() {
        let author = this.get('author');
        let authors = this.get('availableAuthors');

        return authors.findBy('slug', author);
    }

    @action
    changeType(type) {
        this.set('type', get(type, 'value'));
    }

    @action
    changeAuthor(author) {
        this.set('author', get(author, 'slug'));
    }

    @action
    changeTag(tag) {
        this.set('tag', get(tag, 'slug'));
    }

    @action
    changeOrder(order) {
        this.set('order', get(order, 'value'));
    }

    @action
    openEditor(post) {
        this.transitionToRoute('editor.edit', 'post', post.get('id'));
    }
}
