function extractPlaceNames(text) {
    const keywords = ['cafe', 'hotel', 'restaurant', 'inn', 'valley', 'bay', 'district', 'tower', 'square', 'museum'];
    const lines = text.split('\n');
    const found = [];

    for (let line of lines) {
        for (let keyword of keywords) {
            const regex = new RegExp(`\\b([A-Z][\\w\\s]+${keyword}[\\w\\s]*)`, 'gi');
            const matches = [...line.matchAll(regex)];
            found.push(...matches.map(m => m[1].trim()));
        }
    }

    return [...new Set(found)];
}

module.exports = { extractPlaceNames };
