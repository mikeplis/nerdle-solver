import * as fs from "fs";
const prompt = require("prompt-sync")({ sigint: true });

import { aggregateEquations } from "./countCharacters";

const charCounts = JSON.parse(fs.readFileSync("charCounts.json", { encoding: "utf-8" }));

const { totalCharCount: initialTotalCharCount, charCountByPosition: initialCharCountByPosition } =
    charCounts;

const initialEquations = fs
    .readFileSync("valid_equations.txt", { encoding: "utf-8" })
    .split("\n")
    .slice(0, -1);

type Guesses = {
    // misses: string[]; // array of characters that aren't in the equation
    // hits: Record<string, number[]>; // mapping of characters to their known positions
    // maybes: Record<string, number[]>; // mapping of characters to their known non-positions
    potentials: string[][];
    includes: string[];
};

function fitsGuesses(equation: string, guesses: Guesses): boolean {
    for (let i = 0; i < guesses.includes.length; i++) {
        const incl = guesses.includes[i];
        if (!equation.includes(incl)) {
            return false;
        }
    }

    for (let i = 0; i < equation.length; i++) {
        const char = equation.charAt(i);
        if (!guesses.potentials[i].includes(char)) {
            // console.log(equation, char, i, guesses.potentials);
            return false;
        }
    }
    return true;
}

function recommendEquations(
    equations: string[],
    totalCharCount: any,
    charCountByPosition: any
): string[] {
    console.log(equations.length);
    const equationScores: Record<string, number> = {};

    equations.forEach((equation) => {
        let equationScore = 0;
        for (let i = 0; i < equation.length; i++) {
            const char = equation.charAt(i);

            const charScore = totalCharCount[char] / 2;
            const charPositionScore = charCountByPosition[i][char] * 3;

            equationScore += charScore + charPositionScore;
        }
        // boosts unique equations
        const finalScore = equationScore * (new Set(equation).size / equation.length);
        equationScores[equation] = finalScore;
    });
    const sortedScores = Object.entries(equationScores).sort(([, a], [, b]) => b - a);

    return sortedScores.map(([x]) => x).slice(0, 10);
}

function incorporateGuess(guesses: Guesses, guess: string, result: string): void {
    for (let i = 0; i < guess.length; i++) {
        const char = guess.charAt(i);
        const res = result.charAt(i);

        switch (res) {
            case "b": {
                // remove char from each array of potentials
                guesses.potentials = guesses.potentials.map((i) => i.filter((c) => c !== char));
                break;
            }
            case "g": {
                guesses.potentials[i] = [char];
                guesses.includes.push(char);
                break;
            }
            case "p": {
                guesses.potentials[i] = guesses.potentials[i].filter((c) => c !== char);
                guesses.includes.push(char);
                break;
            }

            default: {
                throw new Error("invalid result");
            }
        }
    }
}

const potentials = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "*", "/"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "*", "/"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "*", "/"],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "*", "/", "="],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "="],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "="],
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
];

function main() {
    let numGuesses = 0;
    let guesses: Guesses = {
        potentials,
        includes: [],
    };

    console.log(
        JSON.stringify(
            recommendEquations(initialEquations, initialTotalCharCount, initialCharCountByPosition),
            null,
            2
        )
    );

    while (numGuesses < 6) {
        const guess = prompt("What was your guess?: ");
        const result = prompt("What was the result (b, g, p)?: ");

        if (
            guess.length < 8 ||
            result.split("").filter((c: string) => c === "b" || c === "g" || c === "p").length < 8
        ) {
            console.log("invalid guess or result");
            continue;
        }

        incorporateGuess(guesses, guess, result);
        const equations = initialEquations.filter((equation) => fitsGuesses(equation, guesses));
        const { totalCharCount, charCountByPosition } = aggregateEquations(equations);

        console.log(
            JSON.stringify(
                recommendEquations(equations, totalCharCount, charCountByPosition),
                null,
                2
            )
        );

        numGuesses++;
    }
}

main();
