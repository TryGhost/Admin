import BaseSerializer from './application';

export default BaseSerializer.extend({
    embed: true,

    include(request) {
        let includes = [];

        if (request.queryParams.include && request.queryParams.include.indexOf('api_keys') >= 0) {
            includes.push('api_keys');
        }

        if (request.queryParams.include && request.queryParams.include.indexOf('webhooks') >= 0) {
            includes.push('webhooks');
        }

        return includes;
    }
});
