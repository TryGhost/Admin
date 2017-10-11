/* eslint-disable curly */
// borrowed from https://github.com/substack/semver-compare
// licensed under MIT https://github.com/substack/semver-compare/blob/77cdf440cb85f6445547a995fe0dd7c776a8b493/LICENSE
export default function semverCompare(a, b) {
    let pa = a.split('.');
    let pb = b.split('.');
    for (let i = 0; i < 3; i++) {
        let na = Number(pa[i]);
        let nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
}
