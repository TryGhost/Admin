/* eslint-disable camelcase */
import Transform from 'ember-data/transform';
import {getOwner} from '@ember/application';

export default Transform.extend({
    deserialize(serialized) {
        let settings = {};

        if (serialized) {
            try {
                settings = JSON.parse(serialized) || {};
            } catch (e) {
                settings = {};
            }
        }

        let factory = getOwner(this).factoryFor('object:mailchimp-integration');
        return factory.create(settings);

    },

    serialize(deserialized) {
        // TODO: remove the workaround for hasValidated/errors once we have a
        // better validations system
        let serialized = JSON.stringify(deserialized || {});
        let json = JSON.parse(serialized);

        delete json.hasValidated;
        delete json.errors;

        serialized = JSON.stringify(json);

        return serialized;
    }
});
