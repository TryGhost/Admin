import {getNonDecimal} from 'ghost-admin/utils/currency';
import {helper} from '@ember/component/helper';

export function ghPriceAmount(amount, currency) {
    if (amount) {
        let price = getNonDecimal(amount, currency);
        if (price % 1 === 0) {
            return price;
        } else {
            return Math.round(price * 100) / 100;
        }
    }
    return 0;
}

// like {{pluralize}} but formats the number according to current locale
export default helper(function ([amount, currency]) {
    return ghPriceAmount(amount, currency);
});
