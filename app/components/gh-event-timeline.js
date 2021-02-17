import Component from '@glimmer/component';
import moment from 'moment';
import {tracked} from '@glimmer/tracking';

export default class EventTimeline extends Component {
    @tracked
    parsedEvents = null;

    constructor(...args) {
        super(...args);
        this.parseEvents(this.args.events);
    }

    getIcon(event) {
        return event.type;
    }

    getAction(event) {
        if (event.type === 'login_event') {
            return 'logged in';
        }

        if (event.type === 'payment_event') {
            return 'made a payment';
        }

        if (event.type === 'newsletter_event') {
            if (event.data.subscribed) {
                return 'subscribed to';
            } else {
                return 'unsubscribed from';
            }
        }

        if (event.type === 'subscription_event') {
            if (event.data.from_plan === null) {
                return 'started';
            }

            if (event.data.to_plan === null) {
                return 'cancelled';
            }

            return 'changed';
        }
    }

    getObject(event) {
        if (event.type === 'login_event') {
            return '';
        }

        if (event.type === 'payment_event') {
            return '';
        }

        if (event.type === 'newsletter_event') {
            return 'emails';
        }

        if (event.type === 'subscription_event') {
            return 'their paid subscription';
        }
    }

    parseEvents(events) {
        this.parsedEvents = events.map((event) => {
            let subject = event.data.member.name;
            let icon = this.getIcon(event);
            let action = this.getAction(event);
            let object = this.getObject(event);
            let timestamp = moment(event.data.created_at).fromNow();
            return {
                icon,
                subject,
                action,
                object,
                timestamp
            };
        });
    }
}
