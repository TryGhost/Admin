import {Response} from 'ember-cli-mirage';
import {paginatedResponse} from '../utils';

export default function mockIntegrations(server) {
    server.get('/integrations/', paginatedResponse('integrations'));

    server.post('/integrations/', function ({integrations}, request) {
        let body = JSON.parse(request.requestBody);
        let [params] = body.integrations;

        if (!params.name) {
            return new Response(422, {}, {errors: [{
                errorType: 'ValidationError',
                message: 'Name is required',
                property: 'name'
            }]});
        }

        if (integrations.findBy({name: params.name}) || params.name.match(/Duplicate/i)) {
            return new Response(422, {}, {errors: [{
                errorType: 'ValidationError',
                message: 'Name has already been used',
                property: 'name'
            }]});
        }

        // allow factory to create defaults
        if (!params.slug) {
            delete params.slug;
        }

        // use factory creation to auto-create api keys
        return server.create('integration', params);
    });

    server.put('/integrations/:id/');
    server.del('/integrations/:id/');
}
