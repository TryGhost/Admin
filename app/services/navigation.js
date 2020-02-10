import Service from '@ember/service';
import {action} from '@ember/object';
import {observes} from '@ember-decorators/object';
import {inject as service} from '@ember/service';
import {set} from '@ember/object';
import {tracked} from '@glimmer/tracking';

const DEFAULT_SETTINGS = {
    expanded: {
        posts: true
    }
};

export default class NavigationService extends Service {
    @service session;

    @tracked settings;

    constructor() {
        super(...arguments);
        this.updateSettings();
    }

    // eslint-disable-next-line ghost/ember/no-observers
    @observes('session.isAuthenticated', 'session.user.accessibility')
    async updateSettings() {
        // avoid fetching user before authenticated otherwise the 403 can fire
        // during authentication and cause errors during setup/signin
        if (!this.session.isAuthenticated) {
            return;
        }

        let user = await this.session.user;
        let userSettings = JSON.parse(user.get('accessibility')) || {};
        this.settings = userSettings.navigation || Object.assign({}, DEFAULT_SETTINGS);
    }

    @action
    async toggleExpansion(key) {
        if (!this.settings.expanded) {
            this.settings.expanded = {};
        }

        // set is still needed here because we're not tracking deep keys
        // and Ember picks up that our templates are dependent on them and
        // complains. TODO: can we avoid set?
        set(this.settings.expanded, key, !this.settings.expanded[key]);

        return await this._saveNavigationSettings();
    }

    async _saveNavigationSettings() {
        let user = await this.session.user;
        let userSettings = JSON.parse(user.get('accessibility'));
        userSettings.navigation = this.settings;
        user.set('accessibility', JSON.stringify(userSettings));
        return user.save();
    }
}
