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
        // TODO: remove the workaround for hasValidated/errors once we have a
        // better validations system
        let serialized = JSON.stringify(deserialized);
        let json = JSON.parse(serialized);

        delete json.hasValidated;
        delete json.errors;

        serialized = JSON.stringify(json);

        return deserialized ? serialized : {};
    }
});
