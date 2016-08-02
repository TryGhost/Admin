/* jshint expr:true */
import { expect } from 'chai';
import {
    describeComponent,
    it
} from 'ember-mocha';
import hbs from 'htmlbars-inline-precompile';
import startApp from 'ghost-admin/tests/helpers/start-app';
import run from 'ember-runloop';
import $ from 'jquery';

describeComponent(
    'modals/invite-new-user',
    'Integration: Component: modals/invite-new-user',
    {
        integration: true
    },
    function() {
        let application;

        beforeEach(function () {
            application = startApp();
        });

        it('renders', function() {
            this.render(hbs`{{modals/invite-new-user}}`);
            expect(this.$()).to.have.length(1);
        });

        it('input has focus', function() {
            this.render(hbs`{{modals/invite-new-user}}`);
            run.later(this, function () {
                expect($(this).is(':focus')).to.be.true;
            }, 500);
        });
    }
);
