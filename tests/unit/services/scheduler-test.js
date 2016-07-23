/* jshint expr:true */
import {expect} from 'chai';
import {
    describeModule,
    it
} from 'ember-mocha';
import {later} from 'ember-runloop';
import RSVP from 'rsvp';

const {Promise} = RSVP;

describeModule(
    'service:scheduler',
    'Unit: Service: scheduler',
    {},
    function() {
        it('correctly schedules promises in order', function (done) {
            let number = 0;
            let service = this.subject();

            service.promise('test', () => {
                expect(number).to.equal(0);
                number++;
            });

            service.promise('test', () => {
                return new Promise((resolve) => {
                    expect(number).to.equal(1);
                    number++;

                    later(null, resolve, 250);
                });
            });

            service.promise('test', () => {
                expect(number).to.equal(2);
                done();
            });
        });

        it('correctly schedules and cancels timed events', function (done) {
            let number = 0;
            let service = this.subject();

            service.timer('test', 'later', () => number++, 250);

            later(null, () => {
                service.cancel('test');
            }, 200);

            later(null, () => {
                expect(number).to.equal(0);
                done();
            }, 300);
        });
    }
);
