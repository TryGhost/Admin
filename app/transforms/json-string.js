import Transform from 'ember-data/transform';

export default Transform.extend({
    deserialize(serialized) {
        return JSON.parse(serialized);
    },

    serialize(deserialized) {
        if (deserialized) {
            return JSON.stringify(deserialized);
        } else {
            return null;
        }
    }
});
