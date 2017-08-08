import RSVP from 'rsvp';
import Service from '@ember/service';
import fetch from 'fetch';
import {isEmpty} from '@ember/utils';
import {readOnly} from '@ember/object/computed';
import {task, taskGroup} from 'ember-concurrency';

const API_URL = 'https://api.unsplash.com';
const API_VERSION = 'v1';

export default Service.extend({
    applicationId: '36b2f94f00d2e400b18b13ac793274c6800d4edce9eb6983310ec9b38aa59bb7',

    columnCount: 3,
    columns: null,
    photos: null,

    _columnHeights: null,
    _pagination: null,

    isLoading: readOnly('_loadingTasks.isRunning'),

    init() {
        this._super(...arguments);
        this._reset();
    },

    loadNew() {
        this._reset();
        return this.get('_loadNew').perform();
    },

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

    changeColumnCount(newColumnCount) {
        this.set('columnCount', newColumnCount);
        this._resetColumns();
    },

    _loadingTasks: taskGroup().drop(),

    _loadNew: task(function* () {
        let url = `${API_URL}/photos?per_page=30`;

        return yield this._makeRequest(url).then((photos) => {
            photos.forEach((photo) => this._addPhoto(photo));
        });
    }).group('_loadingTasks'),

    _loadNextPage: task(function* () {
        return yield this._makeRequest(this._pagination.next)
            .then((photos) => {
                photos.forEach((photo) => this._addPhoto(photo));
            });
    }).group('_loadingTasks'),

    _addPhoto(photo) {
        // pre-calculate ratio for later use
        photo.ratio = photo.height / photo.width;

        // add to general photo list
        this.get('photos').pushObject(photo);

        // add to least populated column
        this._addPhotoToColumns(photo);
    },

    _addPhotoToColumns(photo) {
        let min = Math.min(...this._columnHeights);
        let columnIndex = this._columnHeights.indexOf(min);

        // use a fixed with * ratio to compensate for different overall image sizes
        this._columnHeights[columnIndex] += 300 * photo.ratio;
        this.get('columns')[columnIndex].pushObject(photo);
    },

    _reset() {
        this.set('photos', []);
        this._pagination = {};
        this._resetColumns();
    },

    _resetColumns() {
        let columns = [];
        let columnHeights = [];

        // pre-fill column arrays based on columnCount
        for (let i = 0; i < this.get('columnCount'); i++) {
            columns[i] = [];
            columnHeights[i] = 0;
        }

        this.set('columns', columns);
        this._columnHeights = columnHeights;

        if (!isEmpty(this.get('photos'))) {
            this.get('photos').forEach((photo) => {
                this._addPhotoToColumns(photo);
            });
        }
    },

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
