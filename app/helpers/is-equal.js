import {helper} from 'ember-helper';

export function isEqual(params) {
    let [lhs, rhs] = params;

    return lhs === rhs;
}

export default helper(function (params) {
    return isEqual(params);
});
