import AjaxService from 'ember-ajax/services/ajax';
import computed from 'ember-computed';

export default AjaxService.extend({
    host: 'https://api.unsplash.com',
    version: 'v1',
    unsplashAppId: 'replace-me',

    headers: computed(function () {
        let headers = {};

        headers.Authorization = `Client-ID ${this.unsplashAppId}`;
        headers['Accept-Version'] = this.version;

        return headers;
    }).volatile()
});
