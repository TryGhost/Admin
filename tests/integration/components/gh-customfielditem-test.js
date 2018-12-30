import CustomFieldItem from 'ghost-admin/models/custom-field-item';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {setupComponentTest} from 'ember-mocha';

describe('Integration: Component: gh-customfielditem', function () {
    setupComponentTest('gh-customfielditem', {
        integration: true
    });

    beforeEach(function () {
        this.set('baseUrl', 'http://localhost:2368');
    });

    it('renders', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test'}));

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem}}`);
        let $item = this.$('.gh-customfield-item');

        expect($item.find('.gh-customfield-type').length).to.equal(1);
        expect($item.find('.gh-customfield-name').length).to.equal(1);
        expect($item.find('.gh-customfield-delete').length).to.equal(1);

        // doesn't show any errors
        expect($item.hasClass('gh-customfield-item--error')).to.be.false;
        expect($item.find('.error').length).to.equal(0);
        expect($item.find('.response:visible').length).to.equal(0);
    });

    it('shows add button for new items', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test', isNew: true}));

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem}}`);
        let $item = this.$('.gh-customfield-item');

        expect($item.find('.gh-customfield-add').length).to.equal(1);
        expect($item.find('.gh-customfield-delete').length).to.equal(0);
    });

    it('triggers delete action', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test'}));

        let deleteActionCallCount = 0;
        this.on('deleteItem', (navItem) => {
            expect(navItem).to.equal(this.get('customFieldItem'));
            deleteActionCallCount += 1;
        });

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem deleteItem=(action "deleteItem")}}`);
        this.$('.gh-customfield-delete').trigger('click');

        expect(deleteActionCallCount).to.equal(1);
    });

    it('triggers add action', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test', isNew: true}));

        let addActionCallCount = 0;
        this.on('add', () => {
            addActionCallCount += 1;
        });

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem addItem=(action "add")}}`);
        this.$('.gh-customfield-add').trigger('click');

        expect(addActionCallCount).to.equal(1);
    });

    it('triggers update type action', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test'}));

        let updateActionCallCount = 0;
        this.on('update', () => {
            updateActionCallCount += 1;
        });

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem updateType=(action "update")}}`);
        this.$('.gh-customfield-type select').trigger('change');

        expect(updateActionCallCount).to.equal(1);
    });

    it('triggers update name action', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'Number', name: 'test'}));

        let updateActionCallCount = 0;
        this.on('update', () => {
            updateActionCallCount += 1;
        });

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem updateName=(action "update")}}`);
        this.$('.gh-customfield-name input').trigger('blur');

        expect(updateActionCallCount).to.equal(1);
    });

    it('displays inline errors', function () {
        this.set('customFieldItem', CustomFieldItem.create({type: 'invalid', name: ''}));
        this.get('customFieldItem').validate();

        this.render(hbs`{{gh-customfielditem customFieldItem=customFieldItem}}`);
        let $item = this.$('.gh-customfield-item');

        return wait().then(() => {
            expect($item.hasClass('gh-customfield-item--error')).to.be.true;
            expect($item.find('.gh-customfield-type').hasClass('error')).to.be.true;
            expect($item.find('.gh-customfield-type .response').text().trim()).to.equal('You must specify a valid field type');
            expect($item.find('.gh-customfield-name').hasClass('error')).to.be.true;
            expect($item.find('.gh-customfield-name .response').text().trim()).to.equal('You must specify a field name');
        });
    });
});
