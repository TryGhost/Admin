import DS from 'ember-data';

const {Transform} = DS;

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
