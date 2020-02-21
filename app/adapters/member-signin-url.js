import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({

    fetch(model) {
        let url = `${this.buildURL('member', model.get('id'))}signin_url/`;

        return this.ajax(url, 'GET')
            .then((response) => {
                return response.member_signins[0];
            });
    }
});
