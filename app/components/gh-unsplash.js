import Component from 'ember-component';
import ShortcutsMixin from 'ghost-admin/mixins/shortcuts';
import injectService from 'ember-service/inject';
import {computed} from '@ember/object';
import {run} from '@ember/runloop';

export default Component.extend(ShortcutsMixin, {
    mediaQueries: injectService(),
    unsplash: injectService(),

    tagName: '',
    zoomedPhoto: null,

    shortcuts: {
        escape: 'handleEscape'
    },

    // closure actions
    close() {},
    insert() {},

    columnCount: computed('mediaQueries.{unsplash1col,unsplash2col}', function() {
        let mediaQueries = this.get('mediaQueries');

        if (mediaQueries.get('unsplash1col')) {
            return 1;
        } else if (mediaQueries.get('unsplash2col')) {
            return 2;
        } else {
            return 3;
        }
    }),

    init() {
        this._super(...arguments);
        this._setColumnCount();
    },

    didInsertElement() {
        this._super(...arguments);
        this.get('mediaQueries').on('change', this, this._handleMediaQueryChange);
        this.registerShortcuts();
    },

    willDestroyElement() {
        this._super(...arguments);
        this.get('mediaQueries').off('change', this, this._handleMediaQueryChange);
        this.removeShortcuts();
    },

    actions: {
        loadNextPage() {
            this.get('unsplash').loadNextPage();
        },

        zoomPhoto(photo) {
            this.set('zoomedPhoto', photo);
        },

        closeZoom() {
            this.set('zoomedPhoto', null);
        },

        insert(photo) {
            this.insert(photo);
            this.close();
        },

        close() {
            this.close();
        },

        retry() {
            this.get('unsplash').retryLastRequest();
        },

        handleEscape() {
            if (!this.get('zoomedPhoto')) {
                this.close();
            }
        }
    },

    _handleMediaQueryChange(breakpoint) {
        if (breakpoint.indexOf('unsplash') === 0) {
            run.scheduleOnce('actions', this, this._setColumnCount);
        }
    },

    _setColumnCount() {
        this.get('unsplash').changeColumnCount(this.get('columnCount'));
    }
});
