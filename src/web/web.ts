#!/usr/bin/env node
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
const format = require('string-format')
var program = require('commander');
const { render } = require('micromustache')
import { WebDriver, By, Key } from "selenium-webdriver";
import { assert } from "chai";
import { Browser } from "./Browser";
import "./Extensions"
import _ = require("underscore");
import { sleep } from "../common/utils";
let browser: Browser = new Browser("Chrome");

type Command ={
    line: number,
    name: string,
    args: Array<any>
};

type TestCase  = {
    lineNo: number;
    commandList: Array<Command>
};

// tokenize file:
const VALID_COAMMD:Array<string> = [
    'open', // open url
    'click', // click an elemnet
    'wait', // wait for ms
    'type', // type in a input
    'typeWithEnter', // type an input and press enter
    'verifyText', // verify text for an element
    'verifyBodyText', // verify the text anywhere.
    'verifyNoBodyText', // this text is not presente
    'verifyAttr', // verify attributes
    'alert', // perfrom action on alert
    'reset', // delete all cookies and reset
]


async function getContext(){
    program
    .option('-f, --file <path>', 'path of the test file')
    .option('-l, --line <line_number>', 'It will execute that number only.')
    .option('-hl', '--headless', 'Run with headless browser')
    .parse(process.argv);
       // For test uncomment this line and run <node bin/cmd.js>
    //program.server = "simplestore.dipankar.co.in"
    
    program.file = "/Users/dip/dipankar/node-fest/src/web/sample.txt"
    //program.line = 13;
    var context:any = {}
    if (program.file) {
        context['file'] = program.file;
    } else {
        console.log("You must pass a filepath: (node index.js -s google.com -f ./sample.txt )");
        return;
    }
    // FOR DEBUG
    context.headless = true
    return context;
}

async function getTestCaseFromFile(file:string, context:any){
    var contents = fs.readFileSync(file, 'utf8');
    var lines = contents.split("\n");
    var TestCaseList = Array<TestCase>()

    var testCase:TestCase|null = null;
    for (let i = 0; i < lines.length; i++) {
        let line: string = lines[i]

        // fix the context
        line = render(line, context)
        
        //remove comments
        line = line.replace(/#.*/,"").trim()
        //empty line.
        if (line.length == 0) {
            continue;
        }

        if(line.startsWith("$")){
            line = line.replace("$","")
            var key = line.substring(0, line.indexOf("=")).trim()
            var value = line.substring(line.indexOf("=")+1).trim()
            console.log(`Setting context for ${key} => ${value}`)
            context[key] = value
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
        TestCaseList = TestCaseList.filter(x=>x.lineNo >= program.line)
    }
    console.log(chalk.blue(`Building testcase complete for file. TestCase counts: cmd ${TestCaseList.length}`));
    return TestCaseList;
}


async function executeTestCase(TestCaseList:any, driver:any){
    var pass_count = 0;
    var fail_count = 0;
    var cmd_count  =0;
    for (var tc of TestCaseList) {
        try {
            console.log(chalk.blue(`[${tc.lineNo}] Executing test case ...`));
            for (var cmd1 of tc.commandList) {
                console.log(chalk.grey(`[${cmd1.line}] Processing command at line $${cmd1.line} =>${cmd1.name}`));
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
                    case 'verifyNoBodyText':
                            await driver.assertNoTextVisible("tag_body", cmd1.args.join(":"))
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
}

// Main function 
(async function () {
    var driver:WebDriver | null = null;
    try{
        const context = await getContext();
        const testcase_list = await getTestCaseFromFile(context.file, context);
        // Process Textcase
        driver = browser.Initialize(context.headless)
        await driver.manage().window().maximize();
        await executeTestCase(testcase_list, driver);
    } catch(err){
        console.log(err);
        driver?.quit()
    }
})();
