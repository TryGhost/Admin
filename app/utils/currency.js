export function getSymbol(currency) {
    switch (currency) {
    case 'usd':
    case 'aud':
    case 'cad':
        return '$';
    case 'eur':
        return '€';
    case 'gbp':
        return '£';
    case 'inr':
        return '₹';
    }
}

export function getNonDecimal(amount, currency) {
    return amount / 100;
}
