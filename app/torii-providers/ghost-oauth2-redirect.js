import GhostOauth2 from './ghost-oauth2';
import windowProxy from 'ghost-admin/utils/window-proxy';

export default GhostOauth2.extend({
    open(options) {
        if (options.type) {
            this.set('type', options.type);
        }
        if (options.email) {
            this.set('email', options.email);
        }
        windowProxy.changeLocation(this.buildUrl());
    }
});
