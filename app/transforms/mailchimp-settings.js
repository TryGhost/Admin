/* eslint-disable camelcase */
import MailChimpObject from 'ghost-admin/models/mailchimp-integration';
import Transform from 'ember-data/transform';

export default Transform.extend({
    deserialize(serialized) {
        if (serialized) {
            let settingsObject;
            try {
                settingsObject = JSON.parse(serialized) || {};
            } catch (e) {
                settingsObject = {};
            }

            return MailChimpObject.create(settingsObject);
        }

        return null;
    },

    serialize(deserialized) {
        return deserialized ? JSON.stringify(deserialized) : {};
    }
});
