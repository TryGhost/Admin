import Service from '@ember/service';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';
export default class MembersActivityService extends Service {
    @service ajax;
    @service ghostPaths;

    async fetchTimeline(options = {}) {
        return this._fetchTimelineTask.perform(options);
    }

    @task
    *fetchTimelineTask({limit, filter}) {
        const eventsUrl = this.ghostPaths.url.api('members/events');
        const events = yield this.ajax.request(eventsUrl, {data: {limit, filter}});

        return events;
    }
}
