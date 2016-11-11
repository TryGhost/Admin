/* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
import ApplicationSerializer from 'ghost-admin/serializers/application';
import EmbeddedRecordsMixin from 'ember-data/serializers/embedded-records-mixin';

export default ApplicationSerializer.extend(EmbeddedRecordsMixin, {
    attrs: {
        role: {embedded: 'always'},
        createdAtUTC: {key: 'created_at'},
        updatedAtUTC: {key: 'updated_at'}
    },

    normalize(modelClass, hash) {
        hash.role = hash.role_id;
        delete hash.role_id;
        return this._super(...arguments);
    },

    serialize() {
        let json = this._super(...arguments);
        json.role_id = json.role.id;
        delete json.role;
        return json;
    }
});
