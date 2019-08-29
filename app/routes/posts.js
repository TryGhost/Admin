import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {assign} from '@ember/polyfills';
import {isBlank} from '@ember/utils';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    infinity: service(),
    router: service(),

    queryParams: {
        type: {refreshModel: true},
        author: {refreshModel: true},
        tag: {refreshModel: true},
        order: {refreshModel: true}
    },

    modelName: 'post',

    perPage: 30,

    init() {
        this._super(...arguments);

        // if we're already on this route and we're transiting _to_ this route
        // then the filters are being changed and we shouldn't create a new
        // browser history entry
        // see https://github.com/TryGhost/Ghost/issues/11057
        this.router.on('routeWillChange', (transition) => {
            if (transition.to && (this.routeName === 'posts' || this.routeName === 'pages')) {
                let toThisRoute = transition.to.find(route => route.name === this.routeName);
                if (transition.from && transition.from.name === this.routeName && toThisRoute) {
                    transition.method('replace');
                }
            }
        });
    },

    model(params) {
        return this.session.user.then((user) => {
            let queryParams = {};
            let filterParams = {tag: params.tag};
            let paginationParams = {
                perPageParam: 'limit',
                totalPagesParam: 'meta.pagination.pages'
            };

            assign(filterParams, this._getTypeFilters(params.type));

            if (params.type === 'featured') {
                filterParams.featured = true;
            }

            if (user.isAuthor) {
                // authors can only view their own posts
                filterParams.authors = user.slug;
            } else if (user.isContributor) {
                // Contributors can only view their own draft posts
                filterParams.authors = user.slug;
                filterParams.status = 'draft';
            } else if (params.author) {
                filterParams.authors = params.author;
            }

            let filter = this._filterString(filterParams);
            if (!isBlank(filter)) {
                queryParams.filter = filter;
            }

            if (!isBlank(params.order)) {
                queryParams.order = params.order;
            }

            let perPage = this.perPage;
            let paginationSettings = assign({perPage, startingPage: 1}, paginationParams, queryParams);

            return this.infinity.model(this.modelName, paginationSettings);
        });
    },

    // trigger a background load of all tags and authors for use in the filter dropdowns
    setupController(controller) {
        this._super(...arguments);

        if (!controller._hasLoadedTags) {
            this.store.query('tag', {limit: 'all'}).then(() => {
                controller._hasLoadedTags = true;
            });
        }

        this.session.user.then((user) => {
            if (!user.isAuthorOrContributor && !controller._hasLoadedAuthors) {
                this.store.query('user', {limit: 'all'}).then(() => {
                    controller._hasLoadedAuthors = true;
                });
            }
        });
    },

    actions: {
        queryParamsDidChange() {
            // scroll back to the top
            let contentList = document.querySelector('.content-list');
            if (contentList) {
                contentList.scrollTop = 0;
            }

            this._super(...arguments);
        }
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Posts'
        };
    },

    _getTypeFilters(type) {
        let status = '[draft,scheduled,published]';

        switch (type) {
        case 'draft':
            status = 'draft';
            break;
        case 'published':
            status = 'published';
            break;
        case 'scheduled':
            status = 'scheduled';
            break;
        }

        return {
            status
        };
    },

    _filterString(filter) {
        return Object.keys(filter).map((key) => {
            let value = filter[key];

            if (!isBlank(value)) {
                return `${key}:${filter[key]}`;
            }
        }).compact().join('+');
    }
});
