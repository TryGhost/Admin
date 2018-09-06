import Pretender from 'pretender';
import localeConfig from 'ember-i18n/config/en';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {errorOverride, errorReset} from '../../helpers/adapter-error';
import {expect} from 'chai';
import {getOwner} from '@ember/application';
import {run} from '@ember/runloop';
import {setupTest} from 'ember-mocha';

describe('Unit: Service: unsplash', function () {
    setupTest('service:unsplash', {
        needs: [
            'service:ajax',
            'service:config',
            'service:ghostPaths',
            'service:settings',
            'service:i18n',
            'locale:en/translations',
            'locale:en/config',
            'util:i18n/missing-message',
            'util:i18n/compile-template',
            'config:environment',
            'helper:t'
        ]
    });

    let server;

    beforeEach(function () {
        server = new Pretender();
        getOwner(this).lookup('service:i18n').set('locale', 'en');
        this.register('locale:en/config', localeConfig);
    });

    afterEach(function () {
        server.shutdown();
    });

    it('can load new');
    it('can load next page');

    describe('search', function () {
        it('sends search request');
        it('debounces query updates');
        it('can load next page of search results');
        it('clears photos when starting new search');
        it('loads new when query is cleared');
    });

    describe('columns', function () {
        it('sorts photos into columns based on column height');
        it('can change column count');
    });

    describe('error handling', function () {
        it('handles rate limit exceeded', async function () {
            server.get('https://api.unsplash.com/photos', function () {
                return [403, {'x-ratelimit-remaining': '0'}, 'Rate Limit Exceeded'];
            });

            let service = this.subject();

            run(() => {
                service.loadNextPage();
            });
            await wait();

            errorOverride();
            expect(service.get('error').toString()).to.have.string('Unsplash API rate limit reached');
            errorReset();
        });

        it('handles json errors', async function () {
            server.get('https://api.unsplash.com/photos', function () {
                return [500, {'Content-Type': 'application/json'}, JSON.stringify({
                    errors: ['Unsplash API Error']
                })];
            });

            let service = this.subject();

            run(() => {
                service.loadNextPage();
            });
            await wait();

            errorOverride();
            expect(service.get('error')).to.equal('Unsplash API Error');
            errorReset();
        });

        it('handles text errors', async function () {
            server.get('https://api.unsplash.com/photos', function () {
                return [500, {'Content-Type': 'text/xml'}, 'Unsplash text error'];
            });

            let service = this.subject();

            run(() => {
                service.loadNextPage();
            });
            await wait();

            errorOverride();
            expect(service.get('error')).to.equal('Unsplash text error');
            errorReset();
        });
    });

    describe('isLoading', function () {
        it('is false by default');
        it('is true when loading new');
        it('is true when loading next page');
        it('is true when searching');
        it('returns to false when finished');
    });
});
