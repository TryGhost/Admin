import Service from 'ember-service';
import injectService from 'ember-service/inject';

export default Service.extend({
    ajax: injectService('unsplash-ajax'),

    listPhotos() {
        return this.get('ajax').request('photos');
    }
});
