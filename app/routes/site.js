import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {inject as service} from '@ember/service';

export default AuthenticatedRoute.extend({

    ui: service(),

    model() {
        return (new Date()).valueOf();
    },

    activate() {
        this._super(...arguments);
        this.ui.set('isTopmenuHidden', true);
    },

    deactivate() {
        this._super(...arguments);
        this.ui.set('isTopmenuHidden', false);
    },

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Site',
            isTopmenuHidden: true
        };
    }
});
