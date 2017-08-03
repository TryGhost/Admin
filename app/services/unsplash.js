import RSVP from 'rsvp';
import Service from 'ember-service';
import fetch from 'fetch';
import {isEmpty} from 'ember-utils';
import {task} from 'ember-concurrency';

const API_URL = 'https://api.unsplash.com';
const API_VERSION = 'v1';

export default Service.extend({
    applicationId: '36b2f94f00d2e400b18b13ac793274c6800d4edce9eb6983310ec9b38aa59bb7',

    photos: null,

    _pagination: null,

    init() {
        this._super(...arguments);
        this.set('photos', []);
        this._pagination = {};
    },

    loadNew() {
        return this.get('_loadNew').perform();
    },

    _loadNew: task(function* () {
        let url = `${API_URL}/photos`;

        return yield this._makeRequest(url).then((photos) => {
            this.set('photos', photos);
        });
    }).drop(),

    loadNextPage() {
        if (isEmpty(this.get('photos'))) {
            return this.get('_loadNew').perform();
        }

        if (this._pagination.next) {
            return this.get('_loadNextPage').perform();
        }

        // TODO: return error?
        return RSVP.reject();
    },

    _loadNextPage: task(function* () {
        return yield this._makeRequest(this._pagination.next)
            .then((photos) => {
                this.get('photos').pushObjects(photos);
            });
    }).drop(),

    _makeRequest(url) {
        let headers = {};

        headers.Authorization = `Client-ID ${this.applicationId}`;
        headers['Accept-Version'] = API_VERSION;

        return fetch(url, {headers})
            .then((response) => this._extractPagination(response))
            .then((response) => response.json());
    },

    _extractPagination(response) {
        let pagination = {};
        let linkRegex = new RegExp('<(.*)>; rel="(.*)"');

        response.headers.map.link.split(',').forEach((link) => {
            let [, url, rel] = linkRegex.exec(link);

            pagination[rel] = url;
        });

        this._pagination = pagination;

        return response;
    }
});
