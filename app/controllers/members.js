import Controller from '@ember/controller';
import classic from 'ember-classic-decorator';
import ghostPaths from 'ghost-admin/utils/ghost-paths';
import moment from 'moment';
import {action, computed} from '@ember/object';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency-decorators';

/* eslint-disable ghost/ember/alias-model-in-controller */
@classic
export default class MembersController extends Controller {
    @service store;

    members = null;
    searchText = '';

    init() {
        super.init(...arguments);
        this.set('members', this.store.peekAll('member'));
    }

    @computed('members.@each.{name,email}', 'searchText')
    get filteredMembers() {
        let {members, searchText} = this;
        searchText = searchText.toLowerCase();

        let filtered = members.filter((member) => {
            if (!searchText) {
                return true;
            }

            let {name, email} = member;
            return (name && name.toLowerCase().indexOf(searchText) >= 0)
                || (email && email.toLowerCase().indexOf(searchText) >= 0);
        }).sort((a, b) => {
            return b.get('createdAtUTC').valueOf() - a.get('createdAtUTC').valueOf();
        });

        return filtered;
    }

    @action
    exportData() {
        let exportUrl = ghostPaths().url.api('members/csv');
        let downloadURL = `${exportUrl}?limit=all`;
        let iframe = document.getElementById('iframeDownload');

        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'iframeDownload';
            iframe.style.display = 'none';
            document.body.append(iframe);
        }
        iframe.setAttribute('src', downloadURL);
    }

    @task
    *fetchMembers() {
        let newFetchDate = new Date();

        if (this._hasFetchedAll) {
            // fetch any records modified since last fetch
            yield this.store.query('member', {
                limit: 'all',
                filter: `updated_at:>='${moment.utc(this._lastFetchDate).format('YYYY-MM-DD HH:mm:ss')}'`,
                order: 'created_at desc'
            });
        } else {
            // fetch all records
            yield this.store.query('member', {
                limit: 'all',
                order: 'created_at desc'
            });
            this._hasFetchedAll = true;
        }

        this._lastFetchDate = newFetchDate;
    }
}
