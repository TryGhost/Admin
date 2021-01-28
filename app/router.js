import EmberRouter from '@ember/routing/router';
import config from 'ghost-admin/config/environment';
import ghostPaths from 'ghost-admin/utils/ghost-paths';

const Router = EmberRouter.extend({
    location: config.locationType, // use HTML5 History API instead of hash-tag based URLs
    rootURL: ghostPaths().adminRoot // admin interface lives under sub-directory /ghost
});

Router.map(function () {
    this.route('home', {path: '/'});

    this.route('setup', function () {
        this.route('one');
        this.route('two');
        this.route('three');
    });

    this.route('signin');
    this.route('signout');
    this.route('signup', {path: '/signup/:token'});
    this.route('reset', {path: '/reset/:token'});

    this.route('about');
    this.route('site');
    this.route('dashboard');
    this.route('launch');

    this.route('billing', function () {
        this.route('billing-sub', {path: '/*sub'});
    });

    this.route('posts');
    this.route('pages');

    this.route('editor', function () {
        this.route('new', {path: ':type'});
        this.route('edit', {path: ':type/:post_id'});
    });

    this.route('staff', function () {
        this.route('user', {path: ':user_slug'});
    });

    this.route('tags');
    this.route('tag.new', {path: '/tags/new'});
    this.route('tag', {path: '/tags/:tag_slug'});

    this.route('settings');
    this.route('settings.general', {path: '/settings/general'});
    this.route('settings.members-email', {path: '/settings/members-email'});
    this.route('settings.members-payments', {path: '/settings/members-payments'});
    this.route('settings.code-injection', {path: '/settings/code-injection'});
    this.route('settings.theme', {path: '/settings/theme'}, function () {
        this.route('uploadtheme');
    });
    this.route('settings.navigation', {path: '/settings/navigation'});
    this.route('settings.labs', {path: '/settings/labs'});

    this.route('integrations', function () {
        this.route('new');
    });
    this.route('integration', {path: '/integrations/:integration_id'}, function () {
        this.route('webhooks.new', {path: 'webhooks/new'});
        this.route('webhooks.edit', {path: 'webhooks/:webhook_id'});
    });
    this.route('integrations.slack', {path: '/integrations/slack'});
    this.route('integrations.amp', {path: '/integrations/amp'});
    this.route('integrations.firstpromoter', {path: '/integrations/firstpromoter'});
    this.route('integrations.unsplash', {path: '/integrations/unsplash'});
    this.route('integrations.zapier', {path: '/integrations/zapier'});

    this.route('members', function () {
        this.route('import');
    });
    this.route('member.new', {path: '/members/new'});
    this.route('member', {path: '/members/:member_id'});

    this.route('error404', {path: '/*path'});
});

export default Router;
