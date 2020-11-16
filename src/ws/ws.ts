#!/usr/bin/env node

import { Result } from "../common/result";
import { assert, regexMatch, sleep, sleepMS } from "../common/utils";
const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
var program = require('commander');
var namedRegexp = require("named-js-regexp");
const { render } = require('micromustache')
const uniqueString = require('unique-string');
import {TestCase, IObject} from "../types"
const WebSocket = require('ws');

// global context

var Context: IObject = {};

function parseCommand(): IObject {
    var context: any = {}
    program
        .option('-s, --server <url>', 'server endpoints')
        .option('-f, --file <path>', 'path of the test file')
        .option('-l, --line <line_number>', 'It will execute that number only.')
        .parse(process.argv);
    
    context.file = program.file
    context.server = program.server
    // debug override
     //context.file = "/Users/dip/dipankar/node-fest/src/ws/sample.txt"
    return context;
}



// Helper function 
type connection = { ws: WebSocket, msg: string[] }
var globalConnectionMap = new Map<string, connection>();

function connect(url: string) {
    let uid = uniqueString();
    return new Promise(function (resolve, reject) {
        var server = new WebSocket(url);
        server.onopen = function () {
            globalConnectionMap.set(uid, { ws: server, msg: [] })
            resolve(uid);
        };
        server.onerror = function (err:any) {
            reject(err);
        };
        server.onmessage = function (data:any) {
            globalConnectionMap.get(uid)?.msg.push(data.data)
        }
        server.onclose = function () {
            console.log("onClose called")
           // globalConnectionMap.delete(uid)
        }
    });
}


function checkReadFromQueue(tc:TestCase, con_id:string, expected:string, result:Result){
        let con = globalConnectionMap.get(tc.arguments[0])
        assert(con != undefined, "WS connecting doesn't exist");
        if(con!.msg.length == 0 && expected == 'no data'){
            result.markPass(tc)
            return;
        }
        assert(con?.msg.length != 0, `No message exist but expected:<${expected}>`)
        let msg:string = con!.msg.shift() as string
        let result1 = regexMatch(expected, msg) as boolean
        if(result1){
            result.markPass(tc)
        } else{
            throw Error(`Not found expected message but expected:<${tc.arguments[1]}>, observed:<${msg}>`)
        }
}

// executing test case...
async function runAllTestCase(testcase: Array<TestCase>) {
    let result: Result = new Result();
    for (let tc of testcase) {
        // replace arguments
        tc.arguments = tc.arguments.map(x => render(x, context))
        result.markExecuting(tc);
        switch (tc.command) {
            case 'sleep':
                console.log(chalk.blue(util.format('[INFO][%s] Sleeping %o', tc.line, tc.arguments[0])));
                await sleep(parseInt(tc.arguments[0]))
                break;
            case 'context':
                context[tc.arguments[0]] = tc.arguments[1]
                console.log(chalk.blue(util.format('[INFO][%s] Context Set: now %s', tc.line, JSON.stringify(context))));
                break;
            case 'connect':
                try {
                    var conn_id = await connect(tc.arguments[0]) as string
                    context[tc.arguments[1]] = conn_id;
                    console.log(chalk.blue(util.format('[INFO][%s] Context Set: now %s', tc.line, JSON.stringify(context))));
                    result.markPass(tc)
                    if(tc.arguments.length > 2){
                        checkReadFromQueue(tc, conn_id, tc.arguments[2],result)
                    }
                } catch (err) {
                    result.markFail(tc, err.message);
                }
                break;
            case 'disconnect':
                try {
                    let con = globalConnectionMap.get(tc.arguments[0])
                    assert(con != undefined, "WS connecting doesn't exist");
                    con?.ws.close()
                    await sleepMS(500);
                    result.markPass(tc)
                    if(tc.arguments.length > 1){
                        checkReadFromQueue(tc, tc.arguments[0], tc.arguments[1],result)
                    }
                } catch (err) {
                    result.markFail(tc, err.message);
                }
                break;
            case 'send':
                try {
                    let con = globalConnectionMap.get(tc.arguments[0])
                    assert(con != undefined, "WS connecting doesn't exist");
                    con?.ws.send(tc.arguments[1])
                    await sleepMS(100);
                    result.markPass(tc)
                    if(tc.arguments.length > 2){
                        checkReadFromQueue(tc, tc.arguments[0], tc.arguments[2],result)
                    }
                } catch (err) {
                    result.markFail(tc, err.message);
                }
                break;
            case 'check_recv':
                try {
                    checkReadFromQueue(tc, tc.arguments[0], tc.arguments[1], result)
                } catch (err) {
                    result.markFail(tc, err.message);
                }
                break;
        }
    }
    result.printResult();
}

// building testcase from file.
function buildTestFromFile(filepath: string): TestCase[] {
    var contents =""
    try{
        contents = fs.readFileSync(filepath, 'utf8');
    } catch (err){
        throw new Error("[Error] You must pass the test-file path in the command like -f ./textcase.txt")
    }

    var lines = contents.split("\n");
    let result = Array<TestCase>();
    for (var i = 0; i < lines.length; i++) {
        var line: string = lines[i].trim();
        if (line[0] == '#') {
            continue;
        }
        // trim the comments
        if (line.indexOf("#") != -1) {
            line = line.slice(0, line.indexOf("#")).trim()
        }
        if (line.length == 0) {
            continue;
        }

        var lineNo = i + 1;
        let args = line.split("=>").map(x => x.trim()).filter(y => y.length > 0);
        let command = args[0];
        if (["context", "connect", "disconnect", "send", "check_recv", "sleep"].indexOf(command) == -1) {
            throw Error(`Invalid Command found ${command}`)
        }
        result.push({
            line: lineNo,
            command: command,
            arguments: args.slice(1)
        })
    }
    if (result.length == 0) {
        throw Error("No test case found");
    }
    console.log(chalk.yellow(util.format("[INFO] Total test case found ", result.length)));
    return result;
}


// Main function
console.log('Starting API Test...')
let context: IObject = parseCommand();
let testCases = buildTestFromFile(context.file);
(async () => {
    runAllTestCase(testCases);
})();