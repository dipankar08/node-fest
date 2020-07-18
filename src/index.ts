#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
const format = require('string-format')
var program = require('commander');



import { WebDriver, By, Key } from "selenium-webdriver";
import { assert } from "chai";
import { Browser } from "./Browser";
import "./Extensions"
import _ = require("underscore");
let browser: Browser = new Browser("Chrome");

// helper
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function 
(async function () {
    program
        .option('-f, --file <path>', 'path of the test file')
        .option('-l, --line <line_number>', 'It will execute that number only.')
        .parse(process.argv);


    program.file = "./sample.txt"
    //program.line = 5;

    var context = {
        file: null
    }
    if (program.file) {
        context.file = program.file;
    } else {
        console.log("You must pass a filepath: (node index.js -s google.com -f ./sample.txt )");
        return;
    }

    interface Command {
        line: number,
        name: string,
        args: Array<any>
    }

    interface TestCase {
        lineNo: number;
        commandList: Array<Command>
    }

    // tokenlize file:
    let VALID_COAMMD = [
        'open', // open url
        'click', // click an elemnet
        'wait', // wait for ms
        'type', // type in a input
        'typeWithEnter', // type an input and press enter
        'verifyText', // verify text for an element
        'verifyBodyText', // verify the text anywhere.
        'verifyAttr', // verify attributes
        'alert', // perfrom action on alert
        'reset', // delete all cookies and reset
    ]
    var contents = fs.readFileSync(context.file, 'utf8');
    var lines = contents.split("\n");
    var TestCaseList = Array<TestCase>()

    var testCase:TestCase|null = null;
    for (let i = 0; i < lines.length; i++) {
        let line: string = lines[i].trim();
        //remove comments
        line = line.replace(/#.*/,"").trim()
        //empty line.
        if (line.length == 0) {
            continue;
        }
        if(line.endsWith("=>")){
            throw  `Invalid Test input in line ${i+1} as the lines ends with =>`
        }

        if(!line.startsWith("=>")){
            // old test case
             if(testCase != null){
                TestCaseList.push(testCase);
             }
             testCase= { lineNo: i + 1, commandList: [] }
        }
        // process command 
        if(testCase == null){
            throw "Syntax error while processing"
        }
        var commands = line.split("=>")
        for (var cmd of commands) {
            cmd = cmd.trim()
            if(cmd.length == 0){
                continue
            }
            let tokens = cmd.split(":").map(x => x.trim())
            if (tokens.length == 0) {
                console.log(chalk.red(`[${i + 1}]Invalid Token in ${cmd}`));
                throw "Error";
            }
            if (!_.contains(VALID_COAMMD, tokens[0])) {
                console.log(chalk.red(`[${i + 1}] Invalid Commands found in =>${tokens[0]}`));
                throw "Error";
            }
            var sCommand: Command = {
                line:i+1,
                name: tokens[0],
                args: tokens.slice(1)
            }
            testCase.commandList.push(sCommand)
        }
    }
    if(testCase != null){
        TestCaseList.push(testCase);
     }
    if(program.line){
        TestCaseList = TestCaseList.filter(x=>x.lineNo == program.line)
    }
    console.log(chalk.blue(`Building testcase complete for file. TestCase counts: cmd ${TestCaseList.length}`));

    // Process Textcase
    let driver = browser.Initialize()
    await driver.manage().window().maximize();
    var pass_count = 0;
    var fail_count = 0;
    var cmd_count  =0;
    for (var tc of TestCaseList) {
        try {
            console.log(chalk.blue(`[${tc.lineNo}] Executing test case ...`));
            for (var cmd1 of tc.commandList) {
                console.log(chalk.blue(`[${tc.lineNo}] Processing command at line $${cmd1.line}`));
                switch (cmd1.name) {
                    case 'wait':
                        await sleep(parseInt(cmd1.args[0]));
                        break;
                    case 'open':
                        await driver.doNavigate(cmd1.args.join(":"));
                        break;
                    case 'verifyBodyText':
                        await driver.assertTextVisible("tag_body", cmd1.args.join(":"))
                        console.log(chalk.green(`[${cmd1.line}] assertTextVisible Passed!`));
                        break;
                    case 'verifyAttr':
                        await driver.assertAttr(cmd1.args[0], cmd1.args[1], cmd1.args.slice(2).join(":"))
                        console.log(chalk.green(`[${cmd1.line}] assertAttr Passed!`));
                        break;
                    case 'verifyText':
                        await driver.assertTextVisible(cmd1.args[0], cmd1.args.slice(1).join(":"))
                        console.log(chalk.green(`[${cmd1.line}] assertTextVisible Passed!`));
                        break;
                    case 'click':
                        await driver.doSingleClick(cmd1.args.join(":"))
                        break;
                    case 'type':
                        await driver.doType(cmd1.args[0], cmd1.args.slice(1).join(":"))
                        break;
                    case 'typeWithEnter':
                        await driver.doTypeEnter(cmd1.args[0], cmd1.args.slice(1).join(":"))
                        break;
                    case 'alert':
                        await driver.doAlert(cmd1.args[0])
                        break;
                    case 'reset':
                        await driver.doReset()
                        break;
                }
                cmd_count++;
            }
            pass_count++;
        } catch (err) {
            fail_count++
            console.log(chalk.red(`[${tc.lineNo}] Text case failed due to execprion  ${JSON.stringify(tc)}`));
            throw err;
        }
    }
    console.log("Quit")
    //await sleep(5000)
    driver.quit()

    let result = util.format(`

=======================================================
                        SUMMARY                        
=======================================================
Total Command exeuted ${cmd_count}
Pass Count: ${pass_count}
Fail Count: ${fail_count}
Total TC: ${pass_count + fail_count}
Pass Percentage: ${pass_count * 100 / (pass_count + fail_count)}\%
=======================================================`)
    if (fail_count == 0) {
        console.log(chalk.green(result));
    } else {
        console.log(chalk.red(result));
    }
    /*
    var lineIdx = 0;
    if(program.line){
        // Execute from that line.s
        console.log("Executing from Line: :"+program.line)
        lineIdx = parseInt(program.line) -1;
    } 
    */

})();
