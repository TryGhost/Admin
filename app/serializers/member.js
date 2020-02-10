/* eslint-disable camelcase */
import ApplicationSerializer from './application';
import {EmbeddedRecordsMixin} from '@ember-data/serializer/rest';

export default ApplicationSerializer.extend(EmbeddedRecordsMixin, {
    attrs: {
        createdAtUTC: {key: 'created_at'},
        labels: {embedded: 'always'}
    },

    serialize(/*snapshot, options*/) {
        let json = this._super(...arguments);

        // Properties that exist on the model but we don't want sent in the payload
        delete json.stripe;
        // Normalize properties
        json.name = json.name || '';
        json.note = json.note || '';
        return json;
    }
});
