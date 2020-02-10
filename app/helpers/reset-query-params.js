import {helper} from '@ember/component/helper';

export const DEFAULT_QUERY_PARAMS = {
    posts: {
        type: null,
        author: null,
        tag: null,
        order: null
    }
};

// in order to reset query params to their defaults when using <LinkTo> or
// `transitionTo` it's necessary to explicitly set each param. This helper makes
// it easier to provide a "resetting" link, especially when used with custom views

export function resetQueryParams(routeName, newParams) {
    return Object.assign({}, DEFAULT_QUERY_PARAMS[routeName], newParams);
}

export default helper(function (params/*, hash*/) {
    return resetQueryParams(...params);
});
