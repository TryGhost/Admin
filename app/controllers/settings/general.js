import Controller from 'ember-controller';
import computed, {map} from 'ember-computed';
import injectService from 'ember-service/inject';
import observer from 'ember-metal/observer';
import {isPresent} from 'ember-utils';

import SettingsSaveMixin from 'ghost-admin/mixins/settings-save';
import SocialValidationMixin from 'ghost-admin/mixins/social-validation';
import randomPassword from 'ghost-admin/utils/random-password';

export default Controller.extend(SettingsSaveMixin, SocialValidationMixin, {
    showUploadLogoModal: false,
    showUploadCoverModal: false,

    availableTimezones: null,

    notifications: injectService(),
    config: injectService(),
    clock: injectService(),

    selectedTheme: computed('model.activeTheme', 'themes', function () {
        let activeTheme = this.get('model.activeTheme');
        let themes = this.get('themes');
        let selectedTheme;

        themes.forEach((theme) => {
            if (theme.name === activeTheme) {
                selectedTheme = theme;
            }
        });

        return selectedTheme;
    }),

    selectedTimezone: computed('model.activeTimezone', 'availableTimezones', function () {
        let activeTimezone = this.get('model.activeTimezone');
        let availableTimezones = this.get('availableTimezones');

        return availableTimezones
            .filterBy('name', activeTimezone)
            .get('firstObject');
    }),

    logoImageSource: computed('model.logo', function () {
        return this.get('model.logo') || '';
    }),

    coverImageSource: computed('model.cover', function () {
        return this.get('model.cover') || '';
    }),

    localTime: computed('selectedTimezone', 'clock.second', function () {
        let timezone = this.get('selectedTimezone.name');
        this.get('clock.second');
        return timezone ? moment().tz(timezone).format('HH:mm:ss') : moment().utc().format('HH:mm:ss');
    }),

    isDatedPermalinks: computed('model.permalinks', {
        set(key, value) {
            this.set('model.permalinks', value ? '/:year/:month/:day/:slug/' : '/:slug/');

            let slugForm = this.get('model.permalinks');
            return slugForm !== '/:slug/';
        },

        get() {
            let slugForm = this.get('model.permalinks');

            return slugForm !== '/:slug/';
        }
    }),

    themes: map('model.availableThemes', function (theme) {
        return {
            name: theme.name,
            label: theme.package ? `${theme.package.name} - ${theme.package.version}` : theme.name,
            package: theme.package,
            active: !!theme.active
        };
    }).readOnly(),

    generatePassword: observer('model.changeset.isPrivate', function () {
        this.get('model.changeset').clear('password');

        if (this.get('model.changeset.isPrivate') && this.get('model.changeset.change.isPrivate')) {
            this.get('model').set('password', randomPassword());
        }
    }),

    save() {
        let notifications = this.get('notifications');
        let config = this.get('config');

        return this.get('model.changeset').save().then((model) => {
            config.set('blogTitle', model.get('title'));

            // this forces the document title to recompute after
            // a blog title change
            this.send('collectTitleTokens', []);

            return model;
        }).catch((error) => {
            if (error) {
                notifications.showAPIError(error, {key: 'settings.save'});
            }

            throw error;
        });
    },

    actions: {
        checkPostsPerPage() {
            let postsPerPage = this.get('model.postsPerPage');

            if (postsPerPage < 1 || postsPerPage > 1000 || isNaN(postsPerPage)) {
                this.set('model.postsPerPage', 5);
            }
        },

        setTheme(theme) {
            this.set('model.activeTheme', theme.name);
        },

        setTimezone(timezone) {
            this.set('model.activeTimezone', timezone.name);
        },

        toggleUploadCoverModal() {
            this.toggleProperty('showUploadCoverModal');
        },

        toggleUploadLogoModal() {
            this.toggleProperty('showUploadLogoModal');
        },

        validatePrivatePassword() {
            let changeset = this.get('model.changeset');

            if (changeset.get('isPrivate') && !isPresent(changeset.get('password'))) {
                changeset.addError('password', 'Password must be supplied');
            }
        }
    }
});
