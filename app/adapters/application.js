import EmbeddedRelationAdapter from '@tryghost/admin/adapters/embedded-relation-adapter';
import classic from 'ember-classic-decorator';

@classic
export default class Application extends EmbeddedRelationAdapter {
    shouldBackgroundReloadRecord() {
        return false;
    }
}
