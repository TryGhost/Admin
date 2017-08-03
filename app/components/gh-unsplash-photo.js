import Component from 'ember-component';

export default Component.extend({

    height: 0,
    photo: null,
    tagName: '',
    width: 1080,

    didReceiveAttrs() {
        this._super(...arguments);

        let photoHeight = this.get('photo.height');
        let photoWidth = this.get('photo.width');
        let ratio = photoHeight / photoWidth;
        let height = this.get('width') * ratio;

        this.set('height', height);
    }

});
