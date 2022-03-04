import * as fs from "fs";

const equationsFile = fs.readFileSync("valid_equations.txt", { encoding: "utf8", flag: "r" });

const charCountByPosition: Record<number, Record<string, number>> = {};

equationsFile.split("\n").forEach((equation) => {
    for (let i = 0; i < equation.length; i++) {
        const char = equation.charAt(i);
        if (i in charCountByPosition) {
            if (char in charCountByPosition[i]) {
                charCountByPosition[i][char] += 1;
            } else {
                charCountByPosition[i][char] = 1;
            }
        } else {
            charCountByPosition[i] = { [char]: 1 };
        }
    }
});

const totalCharCount = Object.values(charCountByPosition).reduce<Record<string, number>>(
    (acc, charCountForPosition) => {
        Object.entries(charCountForPosition).forEach(([char, count]) => {
            if (char in acc) {
                acc[char] += count;
            } else {
                acc[char] = count;
            }
        });
        return acc;
    },
    {}
);

fs.writeFileSync(
    "charCounts.json",
    JSON.stringify({ totalCharCount, charCountByPosition }, null, 2)
);
