/* eslint-disable camelcase */
import Transform from 'ember-data/transform';
import {getOwner} from '@ember/application';

export default Transform.extend({
    deserialize(serialized) {
        if (serialized) {
            let settingsObject;
            try {
                settingsObject = JSON.parse(serialized) || {};
            } catch (e) {
                settingsObject = {};
            }

            let factory = getOwner(this).factoryFor('object:mailchimp-integration');
            return factory.create(settingsObject);
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
