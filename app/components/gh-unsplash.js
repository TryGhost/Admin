import Component from 'ember-component';
import injectService from 'ember-service/inject';

export default Component.extend({
    unsplash: injectService(),

    tagName: '',
    zoomedPhoto: null,

    // closure actions
    close() {},
    insert() {},

    actions: {
        loadNextPage() {
            this.get('unsplash').loadNextPage();
        },

        zoomPhoto(photo) {
            this.set('zoomedPhoto', photo);
        },

        closeZoom() {
            this.set('zoomedPhoto', null);
        },

        insert(photo) {
            this.insert(photo);
            this.close();
        },

        close() {
            this.close();
        },

        retry() {
            this.get('unsplash').retryLastRequest();
        }
    }
});
