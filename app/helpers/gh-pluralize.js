import {formatNumber} from './format-number';
import {helper} from '@ember/component/helper';
import {pluralize} from 'ember-inflector';

// like {{pluralize}} but formats the number according to current locale
export default helper(function ([number, word], {'without-count': withoutCount}) {
    let output = [];

    if (withoutCount !== true) {
        output.push(formatNumber(number));
    }

    output.push(pluralize(number, word, {withoutCount: true}));

    return output.join(' ');
});
