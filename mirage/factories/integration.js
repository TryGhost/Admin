import moment from 'moment';
import {Factory} from 'ember-cli-mirage';

export default Factory.extend({
    name(i) { return `Integration ${i}`;},
    slug() { return this.name.toLowerCase().replace(' ', '-'); },

    createdAt() { return moment.utc().format(); },
    createdBy: 1,
    updatedAt() { return moment.utc().format(); },
    updatedBy: 1,

    afterCreate(integration, server) {
        let contentKey = server.create('api-key', {type: 'content', integrationId: integration.id});
        let adminKey = server.create('api-key', {type: 'admin', integrationId: integration.id});

        integration.apiKeyIds = [contentKey.id, adminKey.id];
        integration.save();
    }
});
