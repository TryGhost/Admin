import hbs from 'htmlbars-inline-precompile';
import mockPosts from '../../../mirage/config/posts';
import mockTags from '../../../mirage/config/themes';
import {click, findAll, render, settled} from '@ember/test-helpers';
import {clickTrigger, selectChoose, typeInSearch} from 'ember-power-select/test-support/helpers';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupRenderingTest} from 'ember-mocha';
import {startMirage} from 'ghost-admin/initializers/ember-cli-mirage';

// NOTE: although Mirage has posts<->tags relationship and can respond
// to :post-id/?include=tags all ordering information is lost so we
// need to build the tags array manually
const assignPostWithTags = async function postWithTags(context, ...slugs) {
    let post = await context.store.findRecord('post', 1);
    let tags = await context.store.findAll('tag');

    slugs.forEach((slug) => {
        post.get('tags').pushObject(tags.findBy('slug', slug));
    });

    context.set('post', post);
};

// TODO: Unskip and fix
// skipped because it was failing most of the time on Travis
// see https://github.com/TryGhost/Ghost/issues/8805
describe('Integration: Component: gh-psm-tags-input', function () {
    setupRenderingTest();

    let server;

    beforeEach(function () {
        server = startMirage();
        let author = server.create('user');

        mockPosts(server);
        mockTags(server);

        server.create('post', {authors: [author]});
        server.create('tag', {name: 'Tag One', slug: 'one'});
        server.create('tag', {name: 'Tag Two', slug: 'two'});
        server.create('tag', {name: 'Tag Three', slug: 'three'});
        server.create('tag', {name: '#Internal Tag', visibility: 'internal', slug: 'internal'});

        this.set('store', this.owner.lookup('service:store'));
    });

    afterEach(function () {
        server.shutdown();
    });

    it('shows selected tags on render', async function () {
        await assignPostWithTags(this, 'one', 'three');
        await render(hbs`{{gh-psm-tags-input post=post}}`);

        let selected = findAll('.tag-token');
        expect(selected.length).to.equal(2);
        expect(selected[0]).to.contain.text('Tag One');
        expect(selected[1]).to.contain.text('Tag Three');
    });

    it('exposes all tags as options sorted alphabetically', async function () {
        this.set('post', this.store.findRecord('post', 1));
        await settled();

        await render(hbs`{{gh-psm-tags-input post=post}}`);
        await clickTrigger();

        let options = findAll('.ember-power-select-option');
        expect(options.length).to.equal(4);
        expect(options[0]).to.contain.text('Tag One');
        expect(options[1]).to.contain.text('Tag Two');
        expect(options[2]).to.contain.text('Tag Three');
        expect(options[3]).to.contain.text('#Internal Tag');
    });

    it('matches options on lowercase tag names', async function () {
        this.set('post', this.store.findRecord('post', 1));
        await settled();

        await render(hbs`{{gh-psm-tags-input post=post}}`);
        await clickTrigger();
        await typeInSearch('two');
        await settled();

        let options = findAll('.ember-power-select-option');
        expect(options.length).to.equal(2);
        expect(options[0]).to.contain.text('Add "two"...');
        expect(options[1]).to.contain.text('Tag Two');
    });

    it('hides create option on exact matches', async function () {
        this.set('post', this.store.findRecord('post', 1));
        await settled();

        await render(hbs`{{gh-psm-tags-input post=post}}`);
        await clickTrigger();
        await typeInSearch('Tag Two');
        await settled();

        let options = findAll('.ember-power-select-option');
        expect(options.length).to.equal(1);
        expect(options[0]).to.contain.text('Tag Two');
    });

    it('highlights internal teags', async function () {
        await assignPostWithTags(this, 'internal', 'two');
        await render(hbs`{{gh-psm-tags-input post=post}}`);

        let selected = findAll('.tag-token');
        expect(selected.length).to.equal(2);
        expect(selected[0]).to.have.class('tag-token--internal');
        expect(selected[1]).to.not.have.class('tag-token--internal');
    });

    describe('updateTags', function () {
        it('modifies post.tags', async function () {
            await assignPostWithTags(this, 'internal', 'two');
            await render(hbs`{{gh-psm-tags-input post=post}}`);
            await selectChoose('.ember-power-select-trigger', 'Tag One');

            expect(
                this.post.tags.mapBy('name').join(',')
            ).to.equal('#Internal Tag,Tag Two,Tag One');
        });

        it('destroys new tag records when not selected', async function () {
            await assignPostWithTags(this, 'internal', 'two');
            await render(hbs`{{gh-psm-tags-input post=post}}`);
            await clickTrigger();
            await typeInSearch('New');
            await settled();
            await selectChoose('.ember-power-select-trigger', 'Add "New"...');

            let tags = await this.store.peekAll('tag');
            expect(tags.length).to.equal(5);

            let removeBtns = findAll('.ember-power-select-multiple-remove-btn');
            await click(removeBtns[removeBtns.length - 1]);

            tags = await this.store.peekAll('tag');
            expect(tags.length).to.equal(4);
        });
    });

    describe('createTag', function () {
        it('creates new records', async function () {
            await assignPostWithTags(this, 'internal', 'two');
            await render(hbs`{{gh-psm-tags-input post=post}}`);
            await clickTrigger();
            await typeInSearch('New One');
            await settled();
            await selectChoose('.ember-power-select-trigger', 'Add "New One"...');
            await typeInSearch('New Two');
            await settled();
            await selectChoose('.ember-power-select-trigger', 'Add "New Two"...');

            let tags = await this.store.peekAll('tag');
            expect(tags.length).to.equal(6);

            expect(tags.findBy('name', 'New One').isNew).to.be.true;
            expect(tags.findBy('name', 'New Two').isNew).to.be.true;
        });
    });
});
