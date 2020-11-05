import ModalComponent from 'ghost-admin/components/modal-base';

export default ModalComponent.extend({

    showHeader: true,
    showSansSerif: false,
    showBadge: true,
    footerText: '',

    init() {
        this._super(...arguments);
    },

    actions: {
        toggleShowHeader(showHeader) {
            this.set('showHeader', showHeader);
        },

        setTypography(typography) {
            if (typography === 'serif') {
                this.set('showSansSerif', false);
            } else {
                this.set('showSansSerif', true);
            }
        },

        toggleBadge(showBadge) {
            this.set('showBadge', showBadge);
        }
    }
});
