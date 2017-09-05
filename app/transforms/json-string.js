import Transform from 'ember-data/transform';

export default Transform.extend({
    deserialize(serialized) {
        if (serialized === undefined) {
            return null;
        }

        let _serialized = serialized === '' ? null : serialized;
        return JSON.parse(_serialized);
    },

    serialize(deserialized) {
        return deserialized ? JSON.stringify(deserialized) : null;
    }
});
