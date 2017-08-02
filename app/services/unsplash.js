import Service from 'ember-service';
import fetch from 'fetch';

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

    listNew() {
        return this._makeRequest('photos').then((photos) => {
            this.set('photos', photos);
        });
    },

    loadNextPage() {
        if (this._pagination.next) {
            return this._makeRequest(this._pagination.next);
        }

        // TODO: return actual error
        return null;
    },

    _makeRequest(path) {
        let url = `${API_URL}/${path}`;
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
