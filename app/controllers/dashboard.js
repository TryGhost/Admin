import Controller from '@ember/controller';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class DashboardController extends Controller {
    @service feature;
    @service session;
    @service membersStats;

    @tracked
    events = null;

    constructor(...args) {
        super(...args);
        this.membersStats.fetchTimeline().then(({events}) => {
            this.events = events;
        }, (error) => {
            console.error(error);
        });
    }
}
