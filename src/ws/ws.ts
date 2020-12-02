#!/usr/bin/env node

import { BaseTest } from "../common/BaseTest";
import { Result } from "../common/result";
import { assert, regexMatch, sleep, sleepMS } from "../common/utils";
const chalk = require('chalk');
const util = require('util');
var program = require('commander');
const uniqueString = require('unique-string');
import { TestCase, IObject } from "../types"
const WebSocket = require('ws');

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
        server.onerror = function (err: any) {
            reject(err);
        };
        server.onmessage = function (data: any) {
            globalConnectionMap.get(uid)?.msg.push(data.data)
        }
        server.onclose = function () {
            console.log("onClose called")
            // globalConnectionMap.delete(uid)
        }
    });
}

function checkReadFromQueue(tc: TestCase, con_id: string, expected: string, result: Result) {
    let con = globalConnectionMap.get(tc.arguments[0])
    assert(con != undefined, "WS connecting doesn't exist");
    if (con!.msg.length == 0 && expected == 'no data') {
        result.markPass(tc)
        return;
    }
    assert(con?.msg.length != 0, `No message exist but expected:<${expected}>`)
    let msg: string = con!.msg.shift() as string
    let result1 = regexMatch(expected, msg) as boolean
    if (result1) {
        result.markPass(tc)
    } else {
        throw Error(`Not found expected message but expected:<${tc.arguments[1]}>, observed:<${msg}>`)
    }
}

function dump():string{
    var res = ''
    res+= "====  DUMP START ========\n"
    res+= `Number of Coneection: ${globalConnectionMap.size} \n`
    globalConnectionMap.forEach(function(v, k){
        res+=`${k} :: ${v.msg.join("->")}\n`
    })
    res+= "====  DUMP END ========\n"
    return res;
}

class WSTest extends BaseTest {
    modifyContextForDebug() {
        this.context.file = "/Users/dip/dipankar/node-fest/src/ws/sample.txt"
        //this.context.line = 10;
        //this.context.limit = 2;
  }
  
    // executing test case...
    async executeTest(tc: TestCase) {
        switch (tc.command) {
            case 'connect':
                try {
                    var conn_id = await connect(tc.arguments[0]) as string
                    this.context[tc.arguments[1]] = conn_id;
                    console.log(chalk.blue(util.format('[INFO][%s] Context Set: now %s', tc.line, JSON.stringify(this.context))));
                    this.result.markPass(tc)
                    if (tc.arguments.length > 2) {
                        checkReadFromQueue(tc, conn_id, tc.arguments[2], this.result)
                    }
                } catch (err) {
                    this.result.markFail(tc, err.message);
                }
                break;
            case 'disconnect':
                try {
                    let con = globalConnectionMap.get(tc.arguments[0])
                    assert(con != undefined, "WS connecting doesn't exist");
                    con?.ws.close()
                    await sleepMS(500);
                    this.result.markPass(tc)
                    if (tc.arguments.length > 1) {
                        checkReadFromQueue(tc, tc.arguments[0], tc.arguments[1], this.result)
                    }
                } catch (err) {
                    this.result.markFail(tc, err.message);
                }
                break;
            case 'send':
                try {
                    let con = globalConnectionMap.get(tc.arguments[0])
                    assert(con != undefined, "WS connecting doesn't exist");
                    con?.ws.send(tc.arguments[1])
                    await sleepMS(500); // This might cause some issue as process happens async.// If see error incase this limit.
                    this.result.markPass(tc)
                    if (tc.arguments.length > 2) {
                        checkReadFromQueue(tc, tc.arguments[0], tc.arguments[2], this.result)
                    }
                } catch (err) {
                    this.result.markFail(tc, err.message);
                }
                break;
            case 'check_recv':
                try {
                    for(var i =1; i< tc.arguments.length;i++){
                        checkReadFromQueue(tc, tc.arguments[0], tc.arguments[i], this.result)
                    }
                } catch (err) {
                    this.result.markFail(tc, err.message);
                }
                break;
            case 'debug':
                try{
                    console.log(dump());
                } catch(err){
                    this.result.markFail(tc, err.message);
                }
                break
            default:
                assert(false, `[${tc.line}] Invalid command: <${tc.command}>`)
        }
    }
}

(async () => {
    let mWSTest = new WSTest();   
    await mWSTest.main();
})();
