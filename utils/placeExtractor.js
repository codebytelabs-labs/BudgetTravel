function extractPlaceNames(text) {
    const keywords = ['hotel', 'inn', 'museum', 'cafe', 'restaurant', 'tower', 'square', 'district', 'bay', 'valley', 'park'];
    const found = new Set();

    const lines = text.split('\n');

    for (let line of lines) {
        // Only look at capitalized sequences followed by a keyword
        const regex = /\b([A-Z][\w\s&'-]+(?:Hotel|Inn|Museum|Cafe|Restaurant|Tower|Square|District|Bay|Valley|Park))\b/g;

        const matches = line.match(regex);
        if (matches) {
            matches.forEach(m => {
                const clean = m.trim();
                if (clean.length > 3 && !clean.toLowerCase().includes("can be")) {
                    found.add(clean);
                }
            });
        }
    }

    return Array.from(found);
}

module.exports = { extractPlaceNames };
