import AjaxService from 'ember-ajax/services/ajax';
import config from 'ghost-admin/config/environment';
import {AjaxError, isAjaxError} from 'ember-ajax/errors';
import {computed} from '@ember/object';
import {get} from '@ember/object';
import {isArray as isEmberArray} from '@ember/array';
import {isNone} from '@ember/utils';
import {inject as service} from '@ember/service';

const JSON_CONTENT_TYPE = 'application/json';
const GHOST_REQUEST = /\/ghost\/api\//;
const TOKEN_REQUEST = /authentication\/(?:token|ghost|revoke)/;

function isJSONContentType(header) {
    if (!header || isNone(header)) {
        return false;
    }
    return header.indexOf(JSON_CONTENT_TYPE) === 0;
}

/* Version mismatch error */

export function VersionMismatchError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

VersionMismatchError.prototype = Object.create(AjaxError.prototype);

export function isVersionMismatchError(errorOrStatus, payload) {
    if (isAjaxError(errorOrStatus)) {
        return errorOrStatus instanceof VersionMismatchError;
    } else {
        return get(payload || {}, 'errors.firstObject.errorType') === 'VersionMismatchError';
    }
}

/* Request entity too large error */

export function ServerUnreachableError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

ServerUnreachableError.prototype = Object.create(AjaxError.prototype);

export function isServerUnreachableError(error) {
    if (isAjaxError(error)) {
        return error instanceof ServerUnreachableError;
    } else {
        return error === 0 || error === '0';
    }
}

export function RequestEntityTooLargeError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

RequestEntityTooLargeError.prototype = Object.create(AjaxError.prototype);

export function isRequestEntityTooLargeError(errorOrStatus) {
    if (isAjaxError(errorOrStatus)) {
        return errorOrStatus instanceof RequestEntityTooLargeError;
    } else {
        return errorOrStatus === 413;
    }
}

/* Unsupported media type error */

export function UnsupportedMediaTypeError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

UnsupportedMediaTypeError.prototype = Object.create(AjaxError.prototype);

export function isUnsupportedMediaTypeError(errorOrStatus) {
    if (isAjaxError(errorOrStatus)) {
        return errorOrStatus instanceof UnsupportedMediaTypeError;
    } else {
        return errorOrStatus === 415;
    }
}

/* Maintenance error */

export function MaintenanceError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

MaintenanceError.prototype = Object.create(AjaxError.prototype);

export function isMaintenanceError(errorOrStatus) {
    if (isAjaxError(errorOrStatus)) {
        return errorOrStatus instanceof MaintenanceError;
    } else {
        return errorOrStatus === 503;
    }
}

/* Theme validation error */

export function ThemeValidationError(payload, msg) {
    AjaxError.call(this, payload, msg);
}

ThemeValidationError.prototype = Object.create(AjaxError.prototype);

export function isThemeValidationError(errorOrStatus, payload) {
    if (isAjaxError(errorOrStatus)) {
        return errorOrStatus instanceof ThemeValidationError;
    } else {
        return get(payload || {}, 'errors.firstObject.errorType') === 'ThemeValidationError';
    }
}

/* end: custom error types */

let ajaxService = AjaxService.extend({
    session: service(),
    i18n: service(),

    headers: computed('session.isAuthenticated', function () {
        let session = this.get('session');
        let headers = {};

        headers['X-Ghost-Version'] = config.APP.version;
        headers['App-Pragma'] = 'no-cache';

        if (session.get('isAuthenticated')) {
            /* eslint-disable camelcase */
            let {access_token} = session.get('data.authenticated');
            headers.Authorization = `Bearer ${access_token}`;
            /* eslint-enable camelcase */
        }

        return headers;
    }).volatile(),

    // ember-ajax recognises `application/vnd.api+json` as a JSON-API request
    // and formats appropriately, we want to handle `application/json` the same
    _makeRequest(hash) {
        let isAuthenticated = this.get('session.isAuthenticated');
        let isGhostRequest = GHOST_REQUEST.test(hash.url);
        let isTokenRequest = isGhostRequest && TOKEN_REQUEST.test(hash.url);
        let tokenExpiry = this.get('session.authenticated.expires_at');
        let isTokenExpired = tokenExpiry < (new Date()).getTime();

        if (isJSONContentType(hash.contentType) && hash.type !== 'GET') {
            if (typeof hash.data === 'object') {
                hash.data = JSON.stringify(hash.data);
            }
        }

        // we can get into a situation where the app is left open without a
        // network connection and the token subsequently expires, this will
        // result in the next network request returning a 401 and killing the
        // session. This is an attempt to detect that and restore the session
        // using the stored refresh token before continuing with the request
        //
        // TODO:
        // - this might be quite blunt, if we have a lot of requests at once
        //   we probably want to queue the requests until the restore completes
        // BUG:
        // - the original caller gets a rejected promise with `undefined` instead
        //   of the AjaxError object when session restore fails. This isn't a
        //   huge deal because the session will be invalidated and app reloaded
        //   but it would be nice to be consistent
        if (isAuthenticated && isGhostRequest && !isTokenRequest && isTokenExpired) {
            return this.get('session').restore().then(() => this._makeRequest(hash));
        }

        return this._super(...arguments);
    },

    handleResponse(status, headers, payload, request) {
        if (this.isVersionMismatchError(status, headers, payload)) {
            return new VersionMismatchError(payload, this.get('i18n').t('ajax.API server is running a newer version of Ghost, please upgrade.'));
        } else if (this.isServerUnreachableError(status, headers, payload)) {
            return new ServerUnreachableError(payload, this.get('i18n').t('ajax.Server was unreachable.'));
        } else if (this.isRequestEntityTooLargeError(status, headers, payload)) {
            return new RequestEntityTooLargeError(payload, this.get('i18n').t('ajax.Request is larger than the maximum file size the server allows'));
        } else if (this.isUnsupportedMediaTypeError(status, headers, payload)) {
            return new UnsupportedMediaTypeError(payload, this.get('i18n').t('ajax.Request contains an unknown or unsupported file type.'));
        } else if (this.isMaintenanceError(status, headers, payload)) {
            return new MaintenanceError(payload, this.get('i18n').t('ajax.Ghost is currently undergoing maintenance, please wait a moment then retry.'));
        } else if (this.isThemeValidationError(status, headers, payload)) {
            return new ThemeValidationError(payload, this.get('i18n').t('ajax.Theme is not compatible or contains errors.'));
        }

        let isGhostRequest = GHOST_REQUEST.test(request.url);
        let isAuthenticated = this.get('session.isAuthenticated');
        let isUnauthorized = this.isUnauthorizedError(status, headers, payload);

        if (isAuthenticated && isGhostRequest && isUnauthorized) {
            this.get('session').invalidate();
        }

        return this._super(...arguments);
    },

    normalizeErrorResponse(status, headers, payload) {
        if (payload && typeof payload === 'object') {
            let errors = payload.error || payload.errors || payload.message || undefined;

            if (errors) {
                if (!isEmberArray(errors)) {
                    errors = [errors];
                }

                payload.errors = errors.map(function (error) {
                    if (typeof error === 'string') {
                        return {message: error};
                    } else {
                        return error;
                    }
                });
            }
        }

        return this._super(status, headers, payload);
    },

    isVersionMismatchError(status, headers, payload) {
        return isVersionMismatchError(status, payload);
    },

    isServerUnreachableError(status) {
        return isServerUnreachableError(status);
    },

    isRequestEntityTooLargeError(status) {
        return isRequestEntityTooLargeError(status);
    },

    isUnsupportedMediaTypeError(status) {
        return isUnsupportedMediaTypeError(status);
    },

    isMaintenanceError(status, headers, payload) {
        return isMaintenanceError(status, payload);
    },

    isThemeValidationError(status, headers, payload) {
        return isThemeValidationError(status, payload);
    }
});

// we need to reopen so that internal methods use the correct contentType
ajaxService.reopen({
    contentType: 'application/json; charset=UTF-8'
});

export default ajaxService;
