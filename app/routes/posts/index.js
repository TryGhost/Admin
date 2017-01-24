import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import ShortcutsRoute from 'ghost-admin/mixins/shortcuts-route';
import PaginationMixin from 'ghost-admin/mixins/pagination';
import computed from 'ember-computed';

export default AuthenticatedRoute.extend(ShortcutsRoute, PaginationMixin, {

    paginationModel: 'post',

    _type: null,

    model(params) {
        this.set('_type', params.type);
        let paginationSettings = this.get('paginationSettings');

        return this.get('session.user').then((user) => {
            if (user.get('isAuthor')) {
                paginationSettings.filter = paginationSettings.filter
                    ? `${paginationSettings.filter}+author:${user.get('slug')}` : `author:${user.get('slug')}`;
            }

            return this.loadFirstPage().then(() => {
                // using `.filter` allows the template to auto-update when new models are pulled in from the server.
                // we just need to 'return true' to allow all models by default.
                return this.store.filter('post', (post) => {
                    let showPost = true;

                    // only show selected status if not 'all'
                    if (paginationSettings.status !== 'all') {
                        showPost = post.get('status') === paginationSettings.status;
                    }

                    // don't show pages if they are filtered out
                    if (showPost && post.get('page') && paginationSettings.staticPages === false) {
                        showPost = false;
                    }

                    // don't show posts if we're filtering pages
                    if (showPost && !post.get('page') && params.type === 'page') {
                        showPost = false;
                    }

                    // only show an authors own posts
                    if (showPost && user.get('isAuthor')) {
                        showPost = post.isAuthoredByUser(user);
                    }

                    return showPost;
                });
            });
        });
    },

    paginationSettings: computed('_type', function () {
        let type = this.get('_type');
        let status = 'all';
        let staticPages = 'all';

        switch (type) {
        case 'draft':
            status = 'draft';
            staticPages = false;
            break;
        case 'published':
            status = 'published';
            staticPages = false;
            break;
        case 'scheduled':
            status = 'scheduled';
            staticPages = false;
            break;
        case 'page':
            staticPages = true;
            break;
        }

        return {
            status,
            staticPages
        };
    }),

    stepThroughPosts(step) {
        let currentPost = this.get('controller.currentPost');
        let posts = this.get('controller.sortedPosts');
        let length = posts.get('length');
        let newPosition = posts.indexOf(currentPost) + step;

        // if we are on the first or last item
        // just do nothing (desired behavior is to not
        // loop around)
        if (newPosition >= length) {
            return;
        } else if (newPosition < 0) {
            return;
        }

        // TODO: highlight post
        // this.transitionTo('posts.post', posts.objectAt(newPosition));
    },

    shortcuts: {
        'up, k': 'moveUp',
        'down, j': 'moveDown',
        c: 'newPost'
    },

    actions: {
        queryParamsDidChange() {
            this.refresh();
        },

        newPost() {
            this.transitionTo('editor.new');
        },

        moveUp() {
            this.stepThroughPosts(-1);
        },

        moveDown() {
            this.stepThroughPosts(1);
        }
    }
});
