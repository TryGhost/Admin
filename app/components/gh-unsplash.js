import Component from 'ember-component';
import injectService from 'ember-service/inject';

export default Component.extend({
    unsplash: injectService(),

    tagName: '',

    // closure actions
    close() {},
    insert() {},

    actions: {
        loadNextPage() {
            this.get('unsplash').loadNextPage();
        },

        insert(photo) {
            this.insert(photo);
            this.close();
        },

        close() {
            this.close();
        }
    }
});
