/* eslint-disable camelcase */
import Transform from 'ember-data/transform';
import UnsplashObject from 'ghost-admin/models/unsplash-integration';
import {A as emberA, isEmberArray} from 'ember-array/utils';

export default Transform.extend({
    deserialize(serialized) {
        let unsplashObj, settingsArray;
        try {
            settingsArray = JSON.parse(serialized) || [];
        } catch (e) {
            settingsArray = [];
        }

        unsplashObj = settingsArray.map((itemDetails) => {
            return UnsplashObject.create(itemDetails);
        });
        return emberA(unsplashObj);
    },

    serialize(deserialized) {
        let settingsArray;
        if (isEmberArray(deserialized)) {
            settingsArray = deserialized.map((item) => {
                let applicationId = (item.get('applicationId') || '').trim();
                let isActive = (item.get('isActive'));

                return {applicationId, isActive};
            }).compact();
        } else {
            settingsArray = [];
        }
        return JSON.stringify(settingsArray);
    }
});
