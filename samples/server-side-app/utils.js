/**
 * Print provider names only
 *
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProviderNames(data) {
    console.log(`There are overall ${data.length} providers:`)
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`))
}

/**
 * Print provider names only
 *
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProviderBriefInfo(data) {
    console.log(`Right now we support custom models for these ${data.length} providers:`)
    data.sort(sortByKey('name')).forEach(p => console.log(`- ${p.name} (\`${p.id}\`).`))
}

/**
 * Print provider full, but "zip" info about language pairs
 *
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProvidersInfo(data) {
    console.log(`There are overall ${data.length} providers:`)
    console.info(
        data.map(provider => ({
            ...provider,
            symmetric: (provider.symmetric || []).length,
            pairs: (provider.pairs || []).length,
        }))
    )
}

/**
 * Print provider as table view
 * console.table requires node@^v10.0.0
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProvidersAsTable(data) {
    console.log(`\nThere are overall ${data.length} providers:`)

    console.table(
        data.map(({ id, name, symmetric = [], pairs = [] }) => ({
            name,
            symmetric: symmetric.length,
            pairs: pairs.length,
            id,
        })),
        ['name', 'symmetric', 'pairs', 'id']
    )
    console.log('\n\n')
}

/**
 * Generates function to sort an array of objects by one of the object keys
 * To be used like `data.sort(sortByKey('name'))`
 * @param {string} key which object key choose to sort by
 * @returns {function} sorting hat
 */
function sortByKey(key) {
    let one = 1
    let label = key
    if (key[0] === '-') {
        // key starts with `-`
        one = -1
        label = key.slice(1)
    }
    return function (a, b) {
        const nameA = (a[label] || '').toUpperCase() // ignore upper and lowercase
        const nameB = (b[label] || '').toUpperCase() // ignore upper and lowercase
        if (nameA < nameB) {
            return -one
        }
        if (nameA > nameB) {
            return one
        }

        // names must be equal
        return 0
    }
}

// eslint-disable-next-line require-jsdoc
function prettyPrint(data) {
    console.log(JSON.stringify(data, null, 4))
}

const utils = {
    printProviderNames,
    printProviderBriefInfo,
    printProvidersInfo,
    printProvidersAsTable,
    prettyPrint,
}

module.exports = utils
