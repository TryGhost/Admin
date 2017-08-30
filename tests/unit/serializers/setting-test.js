/* jshint expr:true */
/* eslint-disable camelcase */
import Pretender from 'pretender';
import SlackIntegration from 'ghost-admin/models/slack-integration';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {run} from '@ember/runloop';
import {setupModelTest} from 'ember-mocha';

describe('Unit: Serializer: setting', function() {
    setupModelTest('setting', {
        // Specify the other units that are required for this test.
        needs: [
            'serializer:setting',
            'transform:moment-utc',
            'transform:facebook-url-user',
            'transform:twitter-url-user',
            'transform:navigation-settings',
            'transform:slack-settings',
            'transform:unsplash-settings',
            'transform:mailchimp-settings',
            'transform:json-string'
        ]
    });

    let server;

    beforeEach(function () {
        server = new Pretender(function () {
            this.post('/settings', function () {
                let response = {
                    settings: [
                        {
                            id: 23,
                            created_at: '2017-08-11T06:38:10.000Z',
                            created_by: 1,
                            key: 'unsplash',
                            type: 'blog',
                            updated_at: '2017-08-11T08:00:14.000Z',
                            updated_by: 1,
                            value: '{"applicationId":"","isActive":false}'
                        },
                        {
                            id: 24,
                            created_at: '2017-08-30T16:05:00.000Z',
                            created_by: 1,
                            key: 'scheduling',
                            type: 'blog',
                            updated_by: 1,
                            value: '{"readonly":true,"subscribers":{"lastSyncAt":null,"nextSyncAt":null}}'
                        }
                    ]
                };

                return [200, {'Content-Type': 'application/json'}, JSON.stringify(response)];
            });
        });
    });

    afterEach(function () {
        server.shutdown();
    });

    it('serializes single model into a key/value array when saving and skips "scheduling" attr', function () {
        let store = this.store();

        run(() => {
            let setting = store.createRecord('setting', {
                title: 'Serializer Test',
                amp: true,
                slack: [SlackIntegration.create({url: 'http://slack.test'})],
                scheduling: {
                    subscribers: {
                        lastSyncAt: 1504051200000
                    }
                }
            });

            setting.save().then(() => {
                let [request] = server.handledRequests;
                let requestPayload = JSON.parse(request.requestBody);

                // settings model has 21 "public" attrs
                expect(requestPayload.settings.length).to.equal(21);

                // "scheduling" attr should not be sent in the payload
                expect(requestPayload.settings.findBy('key', 'title')).to.exist;
                expect(requestPayload.settings.findBy('key', 'scheduling')).to.not.exist;
            });
        });
    });

    it('normalizes model array into a single model payload');
});
