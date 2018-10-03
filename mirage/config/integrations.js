import {paginatedResponse} from '../utils';

export default function mockIntegrations(server) {
    server.get('/integrations/', paginatedResponse('integrations'));
    server.post('/integrations/');
    server.put('/integrations/:id/');
    server.del('/integrations/:id/');
}
