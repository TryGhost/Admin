import moment from 'moment';
import {Response} from 'ember-cli-mirage';
import {paginateModelCollection} from '../utils';

export default function mockPosts(server) {
    server.post('/products', function ({products}) {
        let attrs = this.normalizedRequestAttrs();

        return products.create(attrs);
    });

    // TODO: handle authors filter
    server.get('/products/', function ({products}, {queryParams}) {
        let {page, limit} = queryParams;

        page = +page || 1;
        limit = +limit || 15;

        let collection = products.all().filter(() => {
            let matchesStatus = true;
            return matchesStatus;
        });

        return paginateModelCollection('products', collection, page, limit);
    });

    server.get('/products/:id/', function ({products}, {params}) {
        let {id} = params;
        let product = products.find(id);

        return product || new Response(404, {}, {
            errors: [{
                type: 'NotFoundError',
                message: 'product not found.'
            }]
        });
    });

    server.put('/products/:id/', function ({products}, {params}) {
        let attrs = this.normalizedRequestAttrs();
        let product = products.find(params.id);

        attrs.updatedAt = moment.utc().toDate();

        return product.update(attrs);
    });

    server.del('/products/:id/');
}

