import Service from '@ember/service';
import fetch from 'fetch';
import moment from 'moment';
import {action} from '@ember/object';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default Service.extend({
    session: service(),

    changelogLatest: null,
    changelogMajorLatest: null,
    changelogUrl: 'https://ghost.org/blog/',
    isShowingModal: false,

    _user: null,

    whatsNewSettings: computed('_user.accessibility', function () {
        let settingsJson = this.get('_user.accessibility') || '{}';
        let settings = JSON.parse(settingsJson);
        return settings.whatsNew;
    }),

    latest: computed('changelogLatest.published_at', 'changelogMajorLatest.published_at', function () {
        let {changelogLatest, changelogMajorLatest} = this;

        if (!changelogLatest && !changelogMajorLatest) {
            return null;
        }

        if (!changelogLatest || !changelogMajorLatest) {
            return changelogLatest || changelogMajorLatest;
        }

        let latestMoment = moment(get(changelogLatest, 'published_at') || '2000-01-01');
        let latestMajorMoment = moment(get(changelogMajorLatest, 'published_at') || '2000-01-01');

        return latestMoment.isAfter(latestMajorMoment) ? changelogLatest : changelogMajorLatest;
    }),

    hasNew: computed('whatsNewSettings.lastSeenDate', 'latest.published_at', function () {
        if (!this.latest) {
            return false;
        }

        let lastSeenDate = this.get('whatsNewSettings.lastSeenDate');
        let lastSeenMoment = moment(lastSeenDate || '2019-01-01 00:00:00');
        let latestDate = this.get('latest.published_at');
        let latestMoment = moment(latestDate || lastSeenDate);
        return latestMoment.isAfter(lastSeenMoment);
    }),

    hasNewMajor: computed('whatsNewSettings.lastSeenDate', 'changelogMajorLatest.published_at', function () {
        if (!this.changelogMajorLatest) {
            return false;
        }

        let lastSeenDate = this.get('whatsNewSettings.lastSeenDate');
        let lastSeenMoment = moment(lastSeenDate || '2019-08-14 00:00:00');
        let latestDate = this.get('changelogMajorLatest.published_at');
        let latestMoment = moment(latestDate || lastSeenDate);
        return latestMoment.isAfter(lastSeenMoment);
    }),

    showModal: action(function () {
        this.set('isShowingModal', true);
    }),

    closeModal: action(function () {
        this.set('isShowingModal', false);
        this.updateLastSeen.perform();
    }),

    fetchLatest: task(function* () {
        try {
            // we should already be logged in at this point so lets grab the user
            // record and store it locally so that we don't have to deal with
            // session.user being a promise and causing issues with CPs
            let user = yield this.session.user;
            this.set('_user', user);

            let response = yield fetch('https://ghost.org/changelog.json');
            if (!response.ok) {
                // eslint-disable-next-line
                return console.error('Failed to fetch changelog', {response});
            }

            let result = yield response.json();
            this.set('changelogLatest', result.changelog[0]);
            this.set('changelogMajorLatest', result.changelogMajor[0]);
            this.set('changelogUrl', result.changelogUrl);
        } catch (e) {
            console.error(e); // eslint-disable-line
        }
    }),

    updateLastSeen: task(function* () {
        let settingsJson = this._user.accessibility || '{}';
        let settings = JSON.parse(settingsJson);

        if (!settings.whatsNew) {
            settings.whatsNew = {};
        }

        if (this.get('latest.published_at')) {
            settings.whatsNew.lastSeenDate = this.latest.published_at;
        }

        this._user.set('accessibility', JSON.stringify(settings));
        yield this._user.save();
    })
});
