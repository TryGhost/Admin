import CustomFieldItem from 'ghost-admin/models/custom-field-item';
import Transform from 'ember-data/transform';
import {A as emberA, isArray as isEmberArray} from '@ember/array';

export default Transform.extend({
    deserialize(serialized) {
        let items, settingsArray;

        try {
            settingsArray = JSON.parse(serialized) || [];
        } catch (e) {
            settingsArray = [];
        }

        items = settingsArray.map(itemDetails => CustomFieldItem.create(itemDetails));

        return emberA(items);
    },

    serialize(deserialized) {
        let settingsArray;

        if (isEmberArray(deserialized)) {
            settingsArray = deserialized.map((item) => {
                let id = item.get('id');
                let type = item.get('type').trim();
                let name = item.get('name').trim();

                return {id, type, name};
            }).compact();
        } else {
            settingsArray = [];
        }

        return JSON.stringify(settingsArray);
    }
});
