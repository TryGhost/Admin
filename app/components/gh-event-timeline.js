import Component from '@glimmer/component';
import moment from 'moment';
import {getNonDecimal, getSymbol} from 'ghost-admin/utils/currency';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

export default class EventTimeline extends Component {
    @tracked
    parsedEvents = null;

    @service intl;

    constructor(...args) {
        super(...args);
        this.parseEvents(this.args.events);
    }

    getIcon(event) {
        return event.type;
    }

    getAction(event) {
        if (event.type === 'signup_event') {
            return this.intl.t('Manual.JS.signed up');
        }

        if (event.type === 'login_event') {
            return this.intl.t('Manual.JS.logged_in');
        }

        if (event.type === 'payment_event') {
            return this.intl.t('Manual.JS.made_a_payment');
        }

        if (event.type === 'newsletter_event') {
            if (event.data.subscribed) {
                return this.intl.t('Manual.JS.subscribed_to');
            } else {
                return this.intl.t('Manual.JS.unsubscribed_from');
            }
        }

        if (event.type === 'subscription_event') {
            if (event.data.from_plan === null) {
                return this.intl.t('Manual.JS.started');
            }

            if (event.data.to_plan === null) {
                return this.intl.t('Manual.JS.cancelled');
            }

            return this.intl.t('Manual.JS.changed');
        }
    }

    getObject(event) {
        if (event.type === 'newsletter_event') {
            return this.intl.t('Manual.JS.emails');
        }

        if (event.type === 'subscription_event') {
            return this.intl.t('Manual.JS.their_subscription');
        }

        return '';
    }

    getInfo(event) {
        if (event.type === 'subscription_event') {
            let mrrDelta = getNonDecimal(event.data.mrr_delta, event.data.currency);
            if (mrrDelta === 0) {
                return;
            }
            let sign = mrrDelta > 0 ? '+' : '-';
            let symbol = getSymbol(event.data.currency);
            return `(MRR ${sign}${symbol}${Math.abs(mrrDelta)})`;
        }
        return;
    }

    parseEvents(events) {
        this.parsedEvents = events.map((event) => {
            let subject = event.data.member.name || event.data.member.email;
            let icon = this.getIcon(event);
            let action = this.getAction(event);
            let object = this.getObject(event);
            let info = this.getInfo(event);
            let timestamp = moment(event.data.created_at).fromNow();
            return {
                member_id: event.data.member_id,
                icon,
                subject,
                action,
                object,
                info,
                timestamp
            };
        });
    }
}
