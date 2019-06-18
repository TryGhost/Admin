import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({
    mediaQueries: service(),

    beforeModel() {
        let firstTag = this.modelFor('tags').get('firstObject');

        this._super(...arguments);

        if (firstTag && !this.get('mediaQueries.maxWidth600')) {
            this.transitionTo('tags.tag', firstTag);
        }
    }
});
