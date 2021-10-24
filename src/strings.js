/**
 * Tag that removes the indent on a template literal.
 * @param {string[]} strings
 * @param  {...any} values
 */
export const dedent = (strings, ...values) => {
    let concatenedString = '';

    values.forEach((value, i) => {
        concatenedString += `${strings[i]}${value}`;
    });
    concatenedString += strings[strings.length - 1];

    let indent = 0;
    const match = concatenedString.match(/^[ \t]*(?=\S)/gm);
    if (match) {
        indent = match.reduce((r, a) => Math.min(r, a.length), Infinity);
    }

    return indent === 0
        ? concatenedString
        : concatenedString.replace(new RegExp(`^[ \\t]{${indent}}`, 'gm'), '');
};

