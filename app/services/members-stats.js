import Service from '@ember/service';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
import {tracked} from '@glimmer/tracking';

export default class MembersStatsService extends Service {
    @service ajax;
    @service ghostPaths;

    @tracked days = '30';
    @tracked stats = null;
    @tracked events = null;
    @tracked countStats = null;
    @tracked mrrStats = null;

    fetch() {
        let daysChanged = this._lastFetchedDays !== this.days;
        let staleData = this._lastFetched && this._lastFetched - new Date() > 1 * 60 * 1000;

        // return an already in-progress promise unless params have changed
        if (this._fetchTask.isRunning && !this._forceRefresh && !daysChanged) {
            return this._fetchTask.last;
        }

        // return existing stats unless data is > 1 min old
        if (this.stats && !this._forceRefresh && !daysChanged && !staleData) {
            return Promise.resolve(this.stats);
        }

        return this._fetchTask.perform();
    }

    fetchTimeline() {
        let staleData = this._lastFetchedTimeline && this._lastFetchedTimeline - new Date() > 1 * 60 * 1000;

        if (this._fetchTimelineTask.isRunning) {
            return this._fetchTask.last;
        }

        if (this.events && !this._forceRefresh && !staleData) {
            return Promise.resolve(this.events);
        }

        return this._fetchTimelineTask.perform();
    }

    fetchCounts() {
        let daysChanged = this._lastFetchedDays !== this.days;
        let staleData = this._lastFetched && this._lastFetched - new Date() > 1 * 60 * 1000;

        // return an already in-progress promise unless params have changed
        if (this._fetchCountsTask.isRunning && !this._forceRefresh && !daysChanged) {
            return this._fetchCountsTask.last;
        }

        // return existing stats unless data is > 1 min old
        if (this.countStats && !this._forceRefresh && !daysChanged && !staleData) {
            return Promise.resolve(this.stats);
        }

        return this._fetchCountsTask.perform();
    }

    fetchMRR() {
        let daysChanged = this._lastFetchedDays !== this.days;
        let staleData = this._lastFetched && this._lastFetched - new Date() > 1 * 60 * 1000;

        // return an already in-progress promise unless params have changed
        if (this._fetchMRRTask.isRunning && !this._forceRefresh && !daysChanged) {
            return this._fetchMRRTask.last;
        }

        // return existing stats unless data is > 1 min old
        if (this.mrrStats && !this._forceRefresh && !daysChanged && !staleData) {
            return Promise.resolve(this.stats);
        }

        return this._fetchMRRTask.perform();
    }

    invalidate() {
        this._forceRefresh = true;
    }

    @task
    *_fetchCountsTask() {
        this._lastFetched = new Date();
        this._forceRefresh = false;

        let statsUrl = this.ghostPaths.url.api('members/stats/count');
        let stats = yield this.ajax.request(statsUrl);
        this.countStats = stats;
        return stats;
    }

    @task
    *_fetchMRRTask() {
        this._lastFetched = new Date();
        this._forceRefresh = false;

        let statsUrl = this.ghostPaths.url.api('members/stats/mrr');
        let stats = yield this.ajax.request(statsUrl);
        this.mrrStats = stats;
        return stats;
    }

    @task
    *_fetchTask() {
        let {days} = this;

        this._lastFetchedDays = days;
        this._lastFetched = new Date();
        this._forceRefresh = false;

        let statsUrl = this.ghostPaths.url.api('members/stats');
        let stats = yield this.ajax.request(statsUrl, {data: {days}});
        this.stats = stats;
        return stats;
    }

    @task
    *_fetchTimelineTask() {
        this._lastFetchedTimeline = new Date();
        let eventsUrl = this.ghostPaths.url.api('members/events');
        let events = yield this.ajax.request(eventsUrl);
        this.events = events;
        return events;
    }
}
