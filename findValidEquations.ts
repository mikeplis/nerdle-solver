import * as fs from "fs";

const keyToChar: Record<string, string> = {
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    a: "+",
    b: "-",
    c: "*",
    d: "/",
    e: "=",
};

const charToKey: Record<string, string> = {
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "+": "a",
    "-": "b",
    "*": "c",
    "/": "d",
    "=": "e",
};

const BASE = Object.keys(keyToChar).length;
const LOG = false;

const EQUATION_LENGTH = 8;

function log(...args: any[]) {
    if (LOG) {
        console.log(...args);
    }
}

function convertNumToKey(num: number): string {
    // https://stackoverflow.com/questions/9909038/formatting-hexadecimal-number-to-short-uuid-in-javascript
    return num.toString(BASE).padStart(EQUATION_LENGTH, "0");
}

function _convertEqToKey(equation: string): string {
    let key = "";
    for (let i = 0; i < equation.length; i++) {
        const c = equation.charAt(i);
        key = key.concat(charToKey[c]);
    }
    return key;
}

function convertToEquation(key: string) {
    let equation = "";

    for (let i = 0; i < key.length; i++) {
        const k = key.charAt(i);

        equation = equation.concat(keyToChar[k]);
    }

    return equation;
}

function isOperand(char: string) {
    return char === "+" || char === "-" || char === "*" || char === "/" || char === "=";
    // return char === "+" || char === "-" || char === "*" || char === "/";
}

function isValidKey(key: string): boolean {
    const firstEq = key.indexOf(charToKey["="]);
    const lastEq = key.lastIndexOf(charToKey["="]);

    if (firstEq === -1) {
        // log("does not contain =");
        return false;
    }

    // can't have = more than once
    if (firstEq !== lastEq) {
        // log("more than one =");
        return false;
    }

    if (firstEq <= 3 || firstEq > 6) {
        return false;
    }

    if (isOperand(keyToChar[key.charAt(0)])) {
        return false;
    }

    if (
        key.lastIndexOf(charToKey["+"]) > firstEq ||
        key.lastIndexOf(charToKey["-"]) > firstEq ||
        key.lastIndexOf(charToKey["*"]) > firstEq ||
        key.lastIndexOf(charToKey["/"]) > firstEq
    ) {
        // log("operand after =");
        return false;
    }

    for (let i = 0; i < key.length; i++) {
        const char = keyToChar[key.charAt(i)];
        const prevChar = keyToChar[key.charAt(i - 1)];
        const nextChar = keyToChar[key.charAt(i + 1)];

        if (isOperand(char) && isOperand(nextChar)) {
            // log("can't have two consecutive operands");
            return false;
        }

        if (i < firstEq) {
            if (
                (prevChar === undefined || isOperand(prevChar)) &&
                char === "0" &&
                (nextChar === undefined || isOperand(nextChar))
            ) {
                // log("no lone zeros");
                return false;
            }
        }
    }

    return true;
}

function evaluateEquation(equation: string): boolean {
    try {
        const [leftStr, rightStr] = equation.split("=");
        const leftEval = eval(leftStr);
        const rightEval = eval(rightStr);

        return leftEval === rightEval;
    } catch (error) {}

    return false;
}

function evaluateKey(key: string): string | null {
    // isTimed && console.timeEnd("pad");
    if (isValidKey(key)) {
        // isTimed && console.time("convert");
        const equation = convertToEquation(key);
        // isTimed && console.timeEnd("convert");

        // isTimed && console.time("eval");
        const evaluation = evaluateEquation(equation);
        // isTimed && console.timeEnd("eval");
        if (evaluation) {
            // console.log(equation, evaluation);
            return equation;
        }
    }

    return null;
}

function main() {
    let writer = fs.createWriteStream("valid_equations.txt");

    const max = parseInt("EEEEEEEE", 15);
    for (let i = 0; i < max; i++) {
        if (i % 10_000_000 === 0) {
            console.log(`${((i / max) * 100).toFixed(2)}% done`);
        }
        const key = convertNumToKey(i);
        const res = evaluateKey(key);
        if (res) {
            // log(key, res);
            writer.write(`${res}\n`);
        }
    }
    writer.end();
}

function test() {
    const equations: [string, boolean][] = [
        ["1+4*6=25", true],
        ["1+4*6=55", false],
    ];
    equations.forEach(([equation, expected]) => {
        const output = evaluateKey(equation);
        if (Boolean(output) !== expected) {
            console.log(equation, "FAIL", `expected ${expected} but got ${output}`);
        } else {
            console.log(equation, "SUCCESS");
        }
    });
}

function test3() {
    const equations: [string, boolean][] = [
        ["1+4*6=25", true], // valid equation
        ["11111111", false], // no =
        ["1+1+1=11", true], // duplicate operand, no repeating
        ["11++1=11", false], // no consecutive operands
        ["1+/-1=11", false], // no consecutive operands
        ["1111111=", false], // invalid index for =
        ["111111=1", true], // valid index for =
        ["11111=11", true], // valid index for =
        ["1111=111", true], // valid index for =
        ["111=1111", false], // invalid index for =
        ["1111=1=1", false], // more than one =
        ["1111=1+1", false], // operand after =
        ["1+0-1=11", false], // no lone zero
        ["0+1-1=11", false], // no lone zero
        ["1+1-0=11", false], // no lone zero
        ["1+1-11=0", true], // lone zero answer allowed
    ];
    equations.forEach(([equation, expected]) => {
        const key = _convertEqToKey(equation);
        const output = isValidKey(key);
        if (Boolean(output) !== expected) {
            console.log(equation, key, "FAIL", `expected ${expected} but got ${output}`);
        } else {
            console.log(equation, key, "SUCCESS");
        }
    });
}

// test();
// test3();
main();
