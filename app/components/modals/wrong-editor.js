import Ember from 'ember';
import ModalComponent from 'ghost/components/modals/base';

const {computed} = Ember;
const {alias} = computed;

export default ModalComponent.extend({

    version: alias('model'),

    title: computed('version', function () {
        let version = this.get('version');

        if (!version) {
            return;
        }

        return `${version.classify()} editor`;
    })

});
