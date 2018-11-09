/* eslint-disable camelcase */
import ApplicationSerializer from 'ghost-admin/serializers/application';
import {pluralize} from 'ember-inflector';

export default ApplicationSerializer.extend({
    attrs: {
        createdAtUTC: {key: 'created_at'},
        updatedAtUTC: {key: 'updated_at'}
    },

    serialize(/*snapshot, options*/) {
        let json = this._super(...arguments);

        // Properties that exist on the model but we don't want sent in the payload
        delete json.count;

        return json;
    },

    // if we use `queryRecord` ensure we grab the first record to avoid
    // DS.SERIALIZER.REST.QUERYRECORD-ARRAY-RESPONSE deprecations
    normalizeResponse(store, primaryModelClass, payload, id, requestType) {
        if (requestType === 'queryRecord') {
            let singular = primaryModelClass.modelName;
            let plural = pluralize(singular);

            if (payload[plural]) {
                payload[singular] = payload[plural][0];
                delete payload[plural];
            }
        }

        // TODO: revisit in nested tags API design
        // API returns `parent` and `children` but Ember Data expects
        // `parent_id` and `children_ids`
        let tags = payload.tag ? [payload.tag] : payload.tags;
        tags.forEach((tag) => {
            if (tag.parent) {
                tag.parent_id = tag.parent;
                delete tag.parent;
            }
            if (tag.children) {
                tag.children_ids = tag.children;
                delete tag.children;
            }
        });

        return this._super(...arguments);
    }
});
