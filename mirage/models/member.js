import {Model, hasMany} from 'miragejs';

export default Model.extend({
    labels: hasMany(),
    emailRecipients: hasMany(),
    products: hasMany(),
    newsletters: hasMany(),
    subscriptions: hasMany()
});
