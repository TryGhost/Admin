import Component from '@ember/component';
import {htmlSafe} from '@ember/template';
import {inject as service} from '@ember/service';

export default Component.extend({
    billing: service(),
    config: service(),
    ghostPaths: service(),
    ajax: service(),
    notifications: service(),

    isOwner: null,

    didInsertElement() {
        this._super(...arguments);

        let fetchingSubscription = false;
        this.billing.getBillingIframe().src = this.billing.getIframeURL();

        window.addEventListener('message', (event) => {
            let token;

            if (event && event.data && event.data.request === 'token') {
                const ghostIdentityUrl = this.get('ghostPaths.url').api('identities');

                this.ajax.request(ghostIdentityUrl).then((response) => {
                    token = response && response.identities && response.identities[0] && response.identities[0].token;
                    this.billing.getBillingIframe().contentWindow.postMessage({
                        request: 'token',
                        response: token
                    }, '*');

                    this.set('isOwner', true);
                }).catch((error) => {
                    if (error.payload?.errors && error.payload.errors[0]?.type === 'NoPermissionError') {
                        // no permission means the current user requesting the token is not the owner of the site.
                        this.set('isOwner', false);

                        // Avoid letting the BMA waiting for a message and send an empty token response instead
                        this.billing.getBillingIframe().contentWindow.postMessage({
                            request: 'token',
                            response: null
                        }, '*');
                    } else {
                        throw error;
                    }
                });

                // NOTE: the handler is placed here to avoid additional logic to check if iframe has loaded
                //       receiving a 'token' request is an indication that page is ready
                if (!fetchingSubscription && !this.billing.get('subscription') && token) {
                    fetchingSubscription = true;
                    this.billing.getBillingIframe().contentWindow.postMessage({
                        query: 'getSubscription',
                        response: 'subscription'
                    }, '*');
                }
            }

            if (event && event.data && event.data.request === 'forceUpgradeInfo') {
                // Send BMA requested information about forceUpgrade and owner name/email
                let ownerUser = null;
                const owner = this.billing.ownerUser;

                if (owner) {
                    ownerUser = {
                        name: owner?.name,
                        email: owner?.email
                    };
                }
                this.billing.getBillingIframe().contentWindow.postMessage({
                    request: 'forceUpgradeInfo',
                    response: {
                        forceUpgrade: this.config.get('hostSettings.forceUpgrade'),
                        isOwner: this.get('isOwner'),
                        ownerUser
                    }
                }, '*');
            }

            if (event && event.data && event.data.subscription) {
                this.billing.set('subscription', event.data.subscription);
                this.billing.set('checkoutRoute', event.data?.checkoutRoute || '/plans');

                // Detect if the current subscription is in a grace state and render a notification
                if (event.data.subscription.status === 'past_due' || event.data.subscription.status === 'unpaid') {
                    // This notification needs to be shown to every user regardless their permissions to see billing
                    this.notifications.showAlert('Billing error: This site is queued for suspension. The owner of this site must update payment information.', {type: 'error', key: 'billing.overdue'});
                } else {
                    this.notifications.closeAlerts('billing.overdue');
                }
                // Detect if the current member limits are exceeded and render a notification
                if (
                    event.data?.exceededLimits
                    && event.data?.exceededLimits.length
                    && event.data?.exceededLimits.indexOf('members') >= 0
                    && event.data?.checkoutRoute
                ) {
                    // The action param will be picked up on a transition from the router and can
                    // then send the destination route as a message to the BMA, which then handles the redirect.
                    const checkoutAction = this.billing.get('billingRouteRoot') + '?action=checkout';

                    this.notifications.showAlert(htmlSafe(`Your audience has grown! To continue publishing, the site owner must confirm pricing for this number of members <a href="${checkoutAction}">here</a>`), {type: 'warn', key: 'billing.exceeded'});
                } else {
                    this.notifications.closeAlerts('billing.exceeded');
                }
            }
        });
    }
});
