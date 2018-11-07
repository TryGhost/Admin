import {Model, belongsTo, hasMany} from 'ember-cli-mirage';

export default Model.extend({
    posts: hasMany(),
    parent: belongsTo('tag', {inverse: 'parent'})
});
