import Controller from '@ember/controller';
import {computed} from '@ember/object';

export default Controller.extend({
    copyrightYear: computed(function () {
        let date = new Date();
        return date.getFullYear();
    })
});
