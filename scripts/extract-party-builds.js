#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatSeason(rawSeason) {
    return 'v' + rawSeason.split('').join('.');
}

function main() {
    const partyNames = process.argv.slice(2).length > 0
        ? process.argv.slice(2)
        : ['spooky6', 'spooky'];
    const outputPath = partyNames.length === 1 && partyNames[0].endsWith('.json')
        ? partyNames[0]
        : 'src/spooky-data/spooky-builds.json';

    const dataDir = path.resolve(__dirname, '..', 'src', 'spooky-data');
    const files = fs
        .readdirSync(dataDir)
        .filter(f => f.match(/^clear-rates-all-.*\.json$/))
        .sort();

    const allRecords = [];
    const seasonCounts = {};

    for (const file of files) {
        const match = file.match(/^clear-rates-all-(.+)\.json$/);
        if (!match) continue;

        const season = formatSeason(match[1]);
        const filePath = path.resolve(dataDir, file);

        let data;
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            data = JSON.parse(fileContent);
        } catch (e) {
            console.error(`Error reading ${file}: ${e.message}`);
            continue;
        }

        const trials = data.trials || [];
        let seasonCount = 0;

        for (const trial of trials) {
            const builds = trial.builds || [];
            for (const build of builds) {
                const players = build.players || [];
                if (players.some(p => partyNames.includes(p))) {
                    allRecords.push({
                        season,
                        trial_id: trial.trial_id,
                        attempts: build.attempts,
                        party: build.party || [],
                        items: build.items || [],
                    });
                    seasonCount++;
                }
            }
        }

        if (seasonCount > 0) {
            seasonCounts[season] = seasonCount;
        }
    }

    // Sort by season then trial_id
    allRecords.sort((a, b) => {
        const seasonCmp = a.season.localeCompare(b.season);
        if (seasonCmp !== 0) return seasonCmp;
        return a.trial_id - b.trial_id;
    });

    // Write output
    fs.writeFileSync(outputPath, JSON.stringify(allRecords, null, 2));

    console.log(`Extracted ${allRecords.length} builds featuring ${partyNames.length === 1 ? `party member "${partyNames[0]}"` : `party members: ${partyNames.join(', ')}`} to ${outputPath}\n`);
    for (const [season, count] of Object.entries(seasonCounts).sort()) {
        console.log(`  ${season}: ${count} builds`);
    }
}

main();