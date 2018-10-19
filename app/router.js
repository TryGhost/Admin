import EmberRouter from '@ember/routing/router';
import config from './config/environment';
import documentTitle from 'ghost-admin/utils/document-title';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import {on} from '@ember/object/evented';
import {inject as service} from '@ember/service';

const Router = EmberRouter.extend({
    location: config.locationType, // use HTML5 History API instead of hash-tag based URLs
    rootURL: ghostPaths().adminRoot, // admin interface lives under sub-directory /ghost

    notifications: service(),

    displayDelayedNotifications: on('didTransition', function () {
        this.get('notifications').displayDelayed();
    })
});

documentTitle();

Router.map(function () {
    this.route('setup', function () {
        this.route('one');
        this.route('two');
        this.route('three');
    });

    this.route('signin');
    this.route('signout');
    this.route('signup', {path: '/signup/:token'});
    this.route('reset', {path: '/reset/:token'});
    this.route('about', {path: '/about'});

    this.route('posts', {path: '/'}, function () {});

    this.route('editor', function () {
        this.route('new', {path: ''});
        this.route('edit', {path: ':post_id'});
    });

    this.route('team', {path: '/team'}, function () {
        this.route('user', {path: ':user_slug'});
    });

    this.route('settings.general', {path: '/settings/general'});
    this.route('settings.tags', {path: '/settings/tags'}, function () {
        this.route('tag', {path: ':tag_slug'});
        this.route('new');
    });
    this.route('settings.labs', {path: '/settings/labs'});
    this.route('settings.code-injection', {path: '/settings/code-injection'});
    this.route('settings.design', {path: '/settings/design'}, function () {
        this.route('uploadtheme');
    });
    this.route('settings.integrations', {path: '/settings/integrations'}, function () {
        this.route('new');
    });
    this.route('settings.integration', {path: '/settings/integrations/:integration_id'}, function () {
        this.route('webhooks.new', {path: 'webhooks/new'});
        this.route('webhooks.edit', {path: 'webhooks/:webhook_id'});
    });
    this.route('settings.integrations.slack', {path: '/settings/integrations/slack'});
    this.route('settings.integrations.amp', {path: '/settings/integrations/amp'});
    this.route('settings.integrations.unsplash', {path: '/settings/integrations/unsplash'});
    this.route('settings.integrations.zapier', {path: '/settings/integrations/zapier'});

    this.route('subscribers', function () {
        this.route('new');
        this.route('import');
    });

    this.route('error404', {path: '/*path'});
});

export default Router;
