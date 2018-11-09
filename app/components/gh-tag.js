import Component from '@ember/component';
import {computed} from '@ember/object';

export default Component.extend({
    tagName: '',

    depthClass: computed('tag.slug', function () {
        let depth = this.tag.slug.split('/').length - 1;

        return `ml${depth * 4}`;
    })
});
