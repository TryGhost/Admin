import ApplicationAdapter from 'ghost-admin/adapters/application';
import SlugUrl from 'ghost-admin/mixins/slug-url';
import classic from 'ember-classic-decorator';

@classic
export default class User extends ApplicationAdapter.extend(SlugUrl) {
    queryRecord(store, type, query) {
        if (!query || query.id !== 'me') {
            return super.queryRecord(...arguments);
        }

        let url = this.buildURL(type.modelName, 'me', null, 'findRecord');

        return this.ajax(url, 'GET', {data: {include: 'roles'}});
    }
}
