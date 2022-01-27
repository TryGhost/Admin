import Component from '@ember/component';
import classic from 'ember-classic-decorator';
import {action, computed} from '@ember/object';
import {reads} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

const US = {flag: '🇺🇸', name: 'US', baseUrl: 'https://api.mailgun.net/v3'};
const EU = {flag: '🇪🇺', name: 'EU', baseUrl: 'https://api.eu.mailgun.net/v3'};

const REPLY_ADDRESSES = [
    {
        label: 'Newsletter email address',
        value: 'newsletter'
    },
    {
        label: 'Support email address',
        value: 'support'
    }
];

@classic
export default class GhMembersEmailSetting extends Component {
    @service
    config;

    @service
    ghostPaths;

    @service
    ajax;

    @service
    settings;

    replyAddresses = null;
    showFromAddressConfirmation = false;
    showSupportAddressConfirmation = false;
    showEmailDesignSettings = false;

    @reads('config.mailgunIsConfigured')
    mailgunIsConfigured;

    @reads('settings.emailTrackOpens')
    emailTrackOpens;

    @computed('settings.membersReplyAddress')
    get selectedReplyAddress() {
        return REPLY_ADDRESSES.findBy('value', this.get('settings.membersReplyAddress'));
    }

    @computed('fromAddress')
    get disableUpdateFromAddressButton() {
        const savedFromAddress = this.get('settings.membersFromAddress') || '';
        if (!savedFromAddress.includes('@') && this.config.emailDomain) {
            return !this.fromAddress || (this.fromAddress === `${savedFromAddress}@${this.config.emailDomain}`);
        }
        return !this.fromAddress || (this.fromAddress === savedFromAddress);
    }

    @computed('supportAddress')
    get disableUpdateSupportAddressButton() {
        const savedSupportAddress = this.get('settings.membersSupportAddress') || '';
        if (!savedSupportAddress.includes('@') && this.config.emailDomain) {
            return !this.supportAddress || (this.supportAddress === `${savedSupportAddress}@${this.config.emailDomain}`);
        }
        return !this.supportAddress || (this.supportAddress === savedSupportAddress);
    }

    @computed('settings.mailgunBaseUrl')
    get mailgunRegion() {
        if (!this.settings.get('mailgunBaseUrl')) {
            return US;
        }

        return [US, EU].find((region) => {
            return region.baseUrl === this.settings.get('mailgunBaseUrl');
        });
    }

    @computed('settings.{mailgunBaseUrl,mailgunApiKey,mailgunDomain}')
    get mailgunSettings() {
        return {
            apiKey: this.get('settings.mailgunApiKey') || '',
            domain: this.get('settings.mailgunDomain') || '',
            baseUrl: this.get('settings.mailgunBaseUrl') || ''
        };
    }

    init() {
        super.init(...arguments);
        this.set('mailgunRegions', [US, EU]);
        this.set('replyAddresses', REPLY_ADDRESSES);
    }

    @action
    toggleFromAddressConfirmation() {
        this.toggleProperty('showFromAddressConfirmation');
    }

    @action
    closeEmailDesignSettings() {
        this.set('showEmailDesignSettings', false);
    }

    @action
    setMailgunDomain(event) {
        this.set('settings.mailgunDomain', event.target.value);
        if (!this.get('settings.mailgunBaseUrl')) {
            this.set('settings.mailgunBaseUrl', this.mailgunRegion.baseUrl);
        }
    }

    @action
    setMailgunApiKey(event) {
        this.set('settings.mailgunApiKey', event.target.value);
        if (!this.get('settings.mailgunBaseUrl')) {
            this.set('settings.mailgunBaseUrl', this.mailgunRegion.baseUrl);
        }
    }

    @action
    setMailgunRegion(region) {
        this.set('settings.mailgunBaseUrl', region.baseUrl);
    }

    @action
    setFromAddress(fromAddress) {
        this.setEmailAddress('fromAddress', fromAddress);
    }

    @action
    setSupportAddress(supportAddress) {
        this.setEmailAddress('supportAddress', supportAddress);
    }

    @action
    toggleEmailTrackOpens(event) {
        if (event) {
            event.preventDefault();
        }
        this.set('settings.emailTrackOpens', !this.emailTrackOpens);
    }

    @action
    setReplyAddress(event) {
        const newReplyAddress = event.value;

        this.set('settings.membersReplyAddress', newReplyAddress);
    }

    @(task(function* () {
        let url = this.get('ghostPaths.url').api('/settings/members/email');
        try {
            const response = yield this.ajax.post(url, {
                data: {
                    email: this.fromAddress,
                    type: 'fromAddressUpdate'
                }
            });
            this.toggleProperty('showFromAddressConfirmation');
            return response;
        } catch (e) {
            // Failed to send email, retry
            return false;
        }
    }).drop())
    updateFromAddress;

    @(task(function* () {
        let url = this.get('ghostPaths.url').api('/settings/members/email');
        try {
            const response = yield this.ajax.post(url, {
                data: {
                    email: this.supportAddress,
                    type: 'supportAddressUpdate'
                }
            });
            this.toggleProperty('showSupportAddressConfirmation');
            return response;
        } catch (e) {
            // Failed to send email, retry
            return false;
        }
    }).drop())
    updateSupportAddress;
}
