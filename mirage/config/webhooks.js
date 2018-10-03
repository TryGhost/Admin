import {paginatedResponse} from '../utils';

export default function mockWebhooks(server) {
    server.get('/webhooks/', paginatedResponse('webhooks'));
    server.post('/webhooks/');
    server.put('/webhooks/:id/');
    server.del('/webhooks/:id/');
}
