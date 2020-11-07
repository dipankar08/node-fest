#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
const format = require('string-format')
var program = require('commander');
const { render } = require('micromustache')
import { WebDriver, By, Key } from "selenium-webdriver";
import { Browser } from "./Browser";
import "./Extensions"
import _ = require("underscore");
import { assert, callNetwork, regexMatch, sleep, sleepMS, splitX } from "../common/utils";
import { Result } from "../common/result";
import { args } from "commander";
let browser: Browser = new Browser("Chrome");

type Command = {
    line: number,
    full_line:string,
    name: string,
    args: Array<any>
};

type TestCase = {
    lineNo: number;
    commandList: Array<Command>
};

// tokenize file:
const VALID_COAMMD: Array<string> = [
    'open', // open url

    'wait', // wait for ms

    'verifyBodyText', // verify the text anywhere.
    'verifyNoBodyText', // this text is not presente
    'verifyText', // verify text for an element
   

    'click', // click an elemnet
    'clickWaitVerify', // Click wait and verify
  
    'input', // type in a input
    'inputWithEnter', // type an input and press enter

    'setAttr', // set attribute
    'verifyAttr', // verify attributes


    'alert', // perfrom action on alert
    'cookie',


    'reset', // delete all cookies and reset,
    'switch',
    'verifyTitle',

    // network
    'network_get',
    'network_post'
]


async function getContext() {
    program
        .option('-f, --file <path>', 'path of the test file')
        .option('-l, --line <line_number>', 'It will execute that number only.')
        .option('-hl', '--headless', 'Run with headless browser')
        .option('-q', '--quit', 'pass this argument if you want to quit the browner at end')
        .parse(process.argv);
    // For test uncomment this line and run <node bin/cmd.js>
    //program.server = "simplestore.dipankar.co.in"
    // default


    program.file = "/Users/dip/dipankar/node-fest/src/web/sample.txt"
    // init with default
    var context: any = {
        quit: true,
        headless:true,
    }
    if (program.file) {
        context['file'] = program.file;
    } else {
        console.log("You must pass a filepath: (node index.js -s google.com -f ./sample.txt )");
        return;
    }
    // FOR DEBUG
    context.headless = false
   // context.quit = false;
    return context;
}

async function getTestCaseFromFile(file: string, context: any) {
    var contents = fs.readFileSync(file, 'utf8');
    var lines = contents.split("\n");
    var TestCaseList = Array<TestCase>()

    var testCase: TestCase | null = null;
    for (let i = 0; i < lines.length; i++) {
        let line: string = lines[i]

        // fix the context
        line = render(line, context)

        //remove comments
        line = line.replace(/##.*/, "").trim()
        //empty line.
        if (line.length == 0) {
            continue;
        }

        if (line.startsWith("$")) {
            line = line.replace("$", "")
            var key = line.substring(0, line.indexOf("=")).trim()
            var value = line.substring(line.indexOf("=") + 1).trim()
            console.log(`Setting context for ${key} => ${value}`)
            context[key] = value
            continue;
        }

        if (line.endsWith("=>")) {
            throw `Invalid Test input in line ${i + 1} as the lines ends with =>`
        }

        if (!line.startsWith("=>")) {
            // old test case
            if (testCase != null) {
                TestCaseList.push(testCase);
            }
            testCase = { lineNo: i + 1, commandList: [] }
        }
        // process command 
        if (testCase == null) {
            throw "Syntax error while processing"
        }
        var commands = line.split("=>")
        for (var cmd of commands) {
            cmd = cmd.trim()
            if (cmd.length == 0) {
                continue
            }
            let tokens = cmd.split(",").map(x => x.trim())
            if (tokens.length == 0) {
                console.log(chalk.red(`[${i + 1}]Invalid Token in ${cmd}`));
                throw "Error";
            }
            if (!_.contains(VALID_COAMMD, tokens[0])) {
                console.log(chalk.red(`[${i + 1}] Invalid Commands found in =>${tokens[0]}`));
                throw "Error";
            }
            var sCommand: Command = {
                line: i + 1,
                name: tokens[0],
                args: tokens.slice(1),
                full_line:cmd,
            }
            testCase.commandList.push(sCommand)
        }
    }
    if (testCase != null) {
        TestCaseList.push(testCase);
    }
    if (program.line) {
        TestCaseList = TestCaseList.filter(x => x.lineNo >= program.line)
    }
    console.log(chalk.blue(`Building testcase complete for file. TestCase counts: cmd ${TestCaseList.length}`));
    return TestCaseList;
}


async function executeTestCase(TestCaseList: any, driver: any, context: any) {

    var result = new Result();

    for (var tc of TestCaseList) {
        try {
            console.log(chalk.blue(`[${tc.lineNo}] Executing test case ...`));
            for (var cmd1 of tc.commandList) {
                var args = cmd1.args;
                console.log(chalk.grey(`[${cmd1.line}] Processing command: ${cmd1.full_line}`));
                switch (cmd1.name) {
                    case 'wait':
                        await sleepMS(parseInt(cmd1.args[0]));
                        break;
                    case 'open':
                        if(args.length == 1){
                            args.push("main")
                        }
                        await driver.open(cmd1.args[0],cmd1.args[1]);
                        break;
                    case 'verifyBodyText':
                        await driver.verifyBodyText("body", cmd1.args[0])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'verifyNoBodyText':
                        await driver.verifyNoBodyText("body", cmd1.args[0])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'verifyAttr':
                        await driver.assertAttr(cmd1.args[0], cmd1.args[1], cmd1.args.slice(2)[0])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'setAttr':
                        await driver.setAttr(cmd1.args[0], cmd1.args[1], cmd1.args.slice(2)[0])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'verifyText':
                        await driver.verifyBodyText(cmd1.args[0], cmd1.args.slice(1)[0])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'verifyTitle':
                        let title = await driver.getTitle();
                        assert(title == args[0], `[${cmd1.line}] Failed! Expected:<${args[0]}> Observed: <${title}>`)
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'click':
                        await driver.doSingleClick(cmd1.args[0])
                        break;
                    case 'clickWaitVerify':
                        await driver.doSingleClick(cmd1.args[0])
                        await sleepMS(parseInt(cmd1.args[1]))
                        await driver.verifyBodyText("body", cmd1.args[2])
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'input':
                        await driver.doType(cmd1.args[0], cmd1.args.slice(1)[0])
                        break;
                    case 'inputWithEnter':
                        await driver.doTypeEnter(cmd1.args[0], cmd1.args.slice(1)[0])
                        break;
                    case 'alert':
                        await driver.doAlert(cmd1.args[0])
                        break;

                    case 'cookie':
                        await driver.cookie(cmd1.args[0], cmd1.args[1], cmd1.args[2])
                        if(cmd1.args[0] == 'verify'){
                            console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        }
                        break;
                    case 'reset':
                        await driver.doReset()
                        break;
                    case 'switch':
                        await driver.switchX(args[0])
                        break;
                    case 'network_get':
                        let networkResp  = await callNetwork('GET', cmd1.args[0], {})
                        assert(regexMatch(cmd1.args[1], networkResp) != false, `[${cmd1.line}] Failed Expected: <${cmd1.args[1]}> Observed:<${networkResp}>`)
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    case 'network_post':
                        console.log(cmd1);
                        networkResp  = await callNetwork('GET', cmd1.args[0], cmd1.arg[1])
                        assert(regexMatch(cmd1.args[2], networkResp) != false, `[${cmd1.line}] Failed Expected: <${cmd1.args[2]}> Observed:<${networkResp}>`)
                        console.log(chalk.green(`[${cmd1.line}] Passed!`));
                        break;
                    default:
                        assert(false, `[${cmd1.line}] Invalid command: <${cmd1.name}>`)
                }
                result.markPass()
            }
        } catch (err) {
            result.markFail();
            console.log(chalk.red(`[${cmd1.line}] Fail. Please fix me. Why? ${err}`));
            throw err;
        }
    }
    console.log("Quit")
    //await sleep(5000)
    if (context.quit == true) {
        driver.quit()
    }
    result.printResult();
}

// Main function 
(async function () {
    var driver: WebDriver | null = null;
    const context = await getContext();
    try {
        const testcase_list = await getTestCaseFromFile(context.file, context);
        // Process Textcase
        driver = browser.Initialize(context.headless)
        await driver.manage().window().maximize();
        await executeTestCase(testcase_list, driver, context);
    } catch (err) {
        console.log(err);
        if (context.quit) {
            if(context.headless == false){
                await sleep(3); // 3 sec to check
            }
            driver?.quit()
        }
    }
})();
