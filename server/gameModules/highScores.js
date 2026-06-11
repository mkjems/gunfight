const DEFAULT_LIMIT = 10;

/**
 * @typedef {import('../../shared/contracts.js').GameResultPayload} GameResultPayload
 * @typedef {import('../../shared/contracts.js').HighScoreEntry} HighScoreEntry
 * @typedef {{ limit?: number }} HighScoresOptions
 */

/**
 * @param {unknown} name
 * @returns {string}
 */
function sanitizeName(name) {
    return (
        String(name || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8) || 'PLAYER'
    );
}

/**
 * @param {unknown} score
 * @returns {number}
 */
function normalizeScore(score) {
    const value = Number(score);

    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.floor(value);
}

/**
 * @param {HighScoreEntry} first
 * @param {HighScoreEntry} second
 * @returns {number}
 */
function sortEntries(first, second) {
    if (second.wins !== first.wins) {
        return second.wins - first.wins;
    }

    if (second.kills !== first.kills) {
        return second.kills - first.kills;
    }

    if (first.deaths !== second.deaths) {
        return first.deaths - second.deaths;
    }

    return first.name.localeCompare(second.name);
}

/**
 * @param {HighScoresOptions=} options
 */
export function createHighScores(options) {
    options = options || {};

    const limit = options.limit || DEFAULT_LIMIT;
    /** @type {Map<string, HighScoreEntry>} */
    const entriesByName = new Map();
    /** @type {Set<string>} */
    const recordedResults = new Set();

    /**
     * @param {string} name
     * @returns {HighScoreEntry}
     */
    function getEntry(name) {
        const safeName = sanitizeName(name);
        let entry = entriesByName.get(safeName);

        if (!entry) {
            entry = {
                name: safeName,
                wins: 0,
                kills: 0,
                deaths: 0
            };
            entriesByName.set(safeName, entry);
        }

        return entry;
    }

    /** @returns {HighScoreEntry[]} */
    function getTable() {
        return Array.from(entriesByName.values())
            .map(function (entry) {
                return {
                    name: entry.name,
                    wins: entry.wins,
                    kills: entry.kills,
                    deaths: entry.deaths
                };
            })
            .sort(sortEntries)
            .slice(0, limit);
    }

    /**
     * @param {GameResultPayload} result
     * @returns {HighScoreEntry[]}
     */
    function recordGame(result) {
        const clients = result.clients;
        const scores = result.scores;
        const resultId = result.resultId;
        let highestScore = 0;
        let winnerCount = 0;

        if (recordedResults.has(resultId) || clients.length < 2) {
            return getTable();
        }

        clients.forEach(function (client) {
            const score = normalizeScore(scores[client.slot]);

            if (score > highestScore) {
                highestScore = score;
                winnerCount = 1;
            } else if (score === highestScore) {
                winnerCount++;
            }
        });

        clients.forEach(function (client) {
            const entry = getEntry(client.name);
            const slot = client.slot;
            const kills = normalizeScore(scores[slot]);
            const deaths = scores.reduce(function (total, score, index) {
                return index === slot ? total : total + normalizeScore(score);
            }, 0);

            entry.kills += kills;
            entry.deaths += deaths;

            if (
                highestScore > 0 &&
                winnerCount === 1 &&
                kills === highestScore
            ) {
                entry.wins++;
            }
        });

        recordedResults.add(resultId);
        return getTable();
    }

    return {
        getTable: getTable,
        recordGame: recordGame
    };
}
