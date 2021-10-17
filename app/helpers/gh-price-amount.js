import {helper} from '@ember/component/helper';
import {getNonDecimal} from 'ghost-admin/utils/currency';

export function ghPriceAmount(amount, currency) {
    if (amount) {
        return Math.round(getNonDecimal(amount, currency));
    }
    return 0;
}

// like {{pluralize}} but formats the number according to current locale
export default helper(function ([amount, currency]) {
    return ghPriceAmount(amount, currency);
});
