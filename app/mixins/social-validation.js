import Mixin from 'ember-metal/mixin';

export default Mixin.create({
    modelKey: 'model',

    actions: {
        validateFacebook() {
            let key = this.get('modelKey');
            let changeset = this.get(`${key}.changeset`);
            let facebookUrl = changeset.get('facebook');

            if (!changeset.get('change.facebook')) {
                // value hasn't changed, so we can just return
                return;
            }

            if (facebookUrl.match(/(?:facebook\.com\/)(\S+)/) || facebookUrl.match(/([a-z\d\.]+)/i)) {
                let username = '';

                if (facebookUrl.match(/(?:facebook\.com\/)(\S+)/)) {
                    [ , username ] = facebookUrl.match(/(?:facebook\.com\/)(\S+)/);
                } else {
                    [ , username ] = facebookUrl.match(/(?:https\:\/\/|http\:\/\/)?(?:www\.)?(?:\w+\.\w+\/+)?(\S+)/mi);
                }

                // check if we have a /page/username or without
                if (username.match(/^(?:\/)?(pages?\/\S+)/mi)) {
                    // we got a page url, now save the username without the / in the beginning

                    [ , username ] = username.match(/^(?:\/)?(pages?\/\S+)/mi);
                } else if (username.match(/^(http|www)|(\/)/) || !username.match(/^([a-z\d\.]{5,50})$/mi)) {
                    changeset.addError(
                        'facebook',
                        !username.match(/^([a-z\d\.]{5,50})$/mi) ?
                            'Your Page name is not a valid Facebook Page name' :
                            'The URL must be in a format like https://www.facebook.com/yourPage'
                    );
                    return;
                }

                changeset.set('facebook', `https://www.facebook.com/${username}`);
                return this.save();
            } else {
                changeset.addError('facebook', 'The URL must be in a format like https://www.facebook.com/yourPage');
            }
        },

        validateTwitter() {
            let key = this.get('modelKey');
            let changeset = this.get(`${key}.changeset`);
            let twitterUrl = changeset.get('twitter');

            if (!changeset.get('change.twitter')) {
                // value hasn't changed, so we can just return
                return;
            }

            if (twitterUrl.match(/(?:twitter\.com\/)(\S+)/) || twitterUrl.match(/([a-z\d\.]+)/i)) {
                let username = [];

                if (twitterUrl.match(/(?:twitter\.com\/)(\S+)/)) {
                    [ , username] = twitterUrl.match(/(?:twitter\.com\/)(\S+)/);
                } else {
                    [username] = twitterUrl.match(/([^/]+)\/?$/mi);
                }

                // check if username starts with http or www and show error if so
                if (username.match(/^(http|www)|(\/)/) || !username.match(/^[a-z\d\.\_]{1,15}$/mi)) {
                    changeset.addError(
                        'twitter',
                        !username.match(/^[a-z\d\.\_]{1,15}$/mi) ?
                            'Your Username is not a valid Twitter Username' :
                            'The URL must be in a format like https://twitter.com/yourUsername'
                    );
                    return;
                }

                changeset.set('twitter', `https://twitter.com/${username}`);
                return this.save();
            } else {
                changeset.addError('twitter', 'The URL must be in a format like https://twitter.com/yourUsername');
            }
        }
    }
});
