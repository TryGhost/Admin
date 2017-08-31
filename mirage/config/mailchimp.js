import {Response} from 'ember-cli-mirage';

export default function mockMailchimp(server) {
    server.get('mailchimp/lists', function ({db}, {queryParams}) {
        let {apiKey} = queryParams;
        let result;

        if (apiKey === 'invalid') {
            return new Response(422, {}, {
                errors: [{
                    errorType: 'ValidationError',
                    message: 'API Key Invalid',
                    context: "Your API key may be invalid, or you've attempted to access the wrong datacenter. (http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/)"
                }]
            });
        }

        /* eslint-disable camelcase */
        if (apiKey === 'valid2') {
            result = {
                lists: [{
                    id: 'test3',
                    name: 'Test List Three'
                }],
                statusCode: 200,
                total_items: 1
            };
        } else {
            result = {
                lists: [{
                    id: 'test1',
                    name: 'Test List One'
                }, {
                    id: 'test2',
                    name: 'Test List Two'
                }],
                statusCode: 200,
                total_items: 2
            };
        }
        /* eslint-enable camelcase */

        return result;
    });
}
