import {helper} from 'ember-helper';

export function wordPluralize(params) {
    let [count, word] = params;

    if (count > 1) {
        word += 's';
    }
    return word;
}

export default helper(wordPluralize);
