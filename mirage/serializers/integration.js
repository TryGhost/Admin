import BaseSerializer from './application';

export default BaseSerializer.extend({
    embed: true,

    include(/*request*/) {
        return ['api_keys', 'webhooks'];
    }
});
