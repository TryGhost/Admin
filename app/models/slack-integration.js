import computed from 'ember-computed';
import {isBlank} from 'ember-utils';
import EmberObject from 'ember-object';

export default EmberObject.extend({
    // values entered here will act as defaults
    url: '',

    isActive: computed('url', function () {
        let url = this.get('url');
        return !isBlank(url);
    })
});
