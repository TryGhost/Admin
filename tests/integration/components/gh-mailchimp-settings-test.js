import MailchimpIntegration from 'ghost-admin/models/mailchimp-integration';
import Pretender from 'pretender';
import Service from '@ember/service';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {find} from 'ember-native-dom-helpers';
import {setupComponentTest} from 'ember-mocha';

const settingsStub = Service.extend({
    mailchimp: {
        isActive: true,
        apiKey: 'valid',
        activeList: {
            id: 'list1',
            name: 'List One'
        }
    },

    save() {
        console.log('stub me');
    }
});

describe('Integration: Component: gh-mailchimp-settings', function() {
    setupComponentTest('gh-mailchimp-settings', {
        integration: true
    });

    let server;

    beforeEach(function () {
        // stub new mailchimp integration (normally created in route model hook)
        this.set('mailchimp', new MailchimpIntegration({
            isActive: true,
            apiKey: 'valid',
            activeList: {
                id: 'list1',
                name: 'List One'
            }
        }));

        // stub feature service (we only care about subscribers flag)
        this.set('feature', {subscribers: true});

        // stub settings service
        this.set('settings', settingsStub.create());

        server = new Pretender();

        server.get('/ghost/api/v0.1/mailchimp/lists/', function (request) {
            /* eslint-disable camelcase */
            if (request.queryParams.apiKey === 'valid') {
                let response = {
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

                return [200, {}, JSON.stringify(response)];

            } else if (request.queryParams.apiKey === 'invalid') {
                let response = {
                    errors: [{
                        errorType: 'ValidationError',
                        message: 'API Key Invalid',
                        context: "Your API key may be invalid, or you've attempted to access the wrong datacenter. (http://developer.mailchimp.com/documentation/mailchimp/guides/error-glossary/)"
                    }]
                };

                return [422, {}, JSON.stringify(response)];
            }
            /* eslint-enable camelcase */
        });
    });

    afterEach(function () {
        server.shutdown();
    });

    describe('subscribers disabled warning', function () {
        it('isn\'t shown when enabled', function () {
            this.set('feature', {subscribers: true});
            this.render(hbs`{{gh-mailchimp-settings feature=feature}}`);

            expect(find('[data-test-subscribers-warning]')).to.not.exist;
        });

        it('is shown when disabled', function () {
            this.set('feature', {subscribers: false});
            this.render(hbs`{{gh-mailchimp-settings feature=feature}}`);

            expect(find('[data-test-subscribers-warning]')).to.exist;
        });
    });

    it('loads mailchimp lists when rendering', async function () {
        this.render(hbs`{{gh-mailchimp-settings mailchimp=mailchimp feature=feature}}`);

        await wait();

        let select = find('[data-test-select="lists"]');

        expect(select, 'lists select element').to.exist;
        expect(select.options.length, 'number of options').to.equal(2);
        expect(select.options.item(0).value, 'first item value').to.equal('test1');
        expect(select.options.item(0).text, 'first item text').to.equal('Test List One');
        expect(select.options.item(1).value, 'second item value').to.equal('test2');
        expect(select.options.item(1).text, 'second item text').to.equal('Test List Two');
    });

    it('saves when pressing CMD-S');

    describe('enable checkbox', function () {
        it('toggles mailchimp.isActive');
        it('can\'t be checked with missing api key');
        it('can\'t be checked invalid api key');
        it('can\'t be checked with no active list');
    });

    describe('api key input', function () {
        it('updates mailchimp.apiKey');
        it('triggers fetchLists on blur');
        it('shows error for invalid format');
        it('shows error for invalid key');
    });

    describe('fetchLists', function () {
        it('selects active list after load');
        it('selects first list if no list matches active list');
        it('clears mailchimp.activeList if no lists are returned');
        it('handles server error');
    });

    describe('saving', function () {
        it('is prevented when api key is missing');
        it('is prevented when api key is invalid');
        it('is prevented when list is missing');
        it('correctly updates settings');
        it('handles server error');
        it('triggers sync poll when becoming active');
        it('triggers sync poll when active list has changed');
    });

    describe('sync details', function () {
        it('isn\'t shown when scheduling is empty');
        it('shows next sync in hours');
        it('shows next sync in minutes when < 1 hour');
        it('shows last sync in bold when < 5 minutes ago');
        it('hides last sync after list changes');
        it('hides next sync when disabled');
        it('hides next sync when re-enabled');
        it('hides next sync after list changes');
        it('shows next sync after sync polling');
    });
});
