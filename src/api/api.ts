#!/usr/bin/env node

import { Result } from "../common/result";
import { sleep } from "../common/utils";
const fs = require('fs');
var request = require('sync-request');
const chalk = require('chalk');
const util = require('util');
var program = require('commander');
var namedRegexp = require("named-js-regexp");
const { render } = require('micromustache')

type Context ={
    server:string,
    file:string,
    line?:number,
}

function parseCommand():Context{
    var context:any = {}
    program
        .option('-s, --server <url>', 'server endpoints')
        .option('-f, --file <path>', 'path of the test file')
        .option('-l, --line <line_number>', 'It will execute that number only.')
        .parse(process.argv);

    // For test uncomment this line and run <node bin/cmd.js>
    //program.server = "simplestore.dipankar.co.in"
    program.file = "/Users/dip/dipankar/node-fest/src/api/sample.txt"
    //program.line = 13;
    if (program.server){
        //console.log("Server:"+program.server);
        context.server = program.server;
    } else{
        console.log("You must pass a URL: (node index.js -s google.com -f ./sample.txt )");
    }
    if(program.file){
        //console.log("File:" + program.file);
        context.file = program.file;
    } else{
        console.log("You must pass a filepath: (node index.js -s google.com -f ./sample.txt )");
    }
    return context;
}

type TestCase ={
    line:number, // file line number
    method:string, // get or post
    url:string, // get or post url
    data:any, // post data it can be any thing based on the type
    expected:string, // expected regex 

    type: 'sleep'|'setup'|'context'|'tc',
    context:any,
};

function build_test_from_line(line:string, i:number):TestCase{
    var tc:TestCase={
        line:0, method:'get', url:'', data:'', expected:'#',type:'tc', context:{}
    }
    tc['line'] = i+1;
    try{
        if(line.startsWith('sleep')){
            tc['type'] = 'sleep';
            try{
                tc['data'] = parseInt(line.replace('sleep ',''))
            } catch(err){
                console.log(chalk.red(util.format('[ERROR/%s] INVALID SLEEP LINE: :%s', i, line)));
                throw Error("Error while reading sleep")
            }
            if(!tc['data']){
                console.log(chalk.red(util.format('[ERROR/%s] INVALID SLEEP LINE: :%s', i, line)));
                throw Error("Error while reading sleep")
            }
            return tc
        } else if(line[0] === '!'){
            tc['type'] = 'setup';
            line = line.substring(1, line.length);
        } else if(line[0] === '$'){
            tc['type'] = 'context';
            line = line.substring(1, line.length);
            let tokens=line.split("=>");
            if(tokens.length != 2){
                console.log(chalk.blue(util.format('[ERROR/%s] YOU ARE SEEING CONTEXT IN WRONG WAY: :%s', i, line)));
            }
            tc['context'] ={}
            tc['context'][tokens[0].trim()] = [tokens[1].trim()]
            return tc;
        } else {
            tc['type'] = 'tc';
        }

        let tokens = line.split("=>");
        tc['method'] = tokens[0].trim()
        tc['url'] = tokens[1].trim()

        if(tc['method'] === 'GET'){
            tc['expected'] = tokens[2].trim()
        } else if(tc['method'] === 'POST'){
            tc['data'] = tokens[2].trim()
            tc['expected'] = tokens[3].trim()
        } else{
            console.log(chalk.blue(util.format('[ERROR/%s] Invalid Method found :%s', i, line)));
        }
    }
    catch(e){
        console.log(chalk.red(util.format('[ERROR/%s] Invalid testcase:%s', i, line)));
        console.log(e);
    }
    if(tc.method == "POST" && ( !tc.data || !tc.expected)){
        console.log(chalk.red(util.format('[ERROR/%s] YOU ARE MISSING POST DATA:%s', i, line)));
    }
    return tc;
}


async function run_test_case(testcase:Array<TestCase>){
    let result:Result = new Result();
    for(let tc of testcase){
        if(tc.type == 'sleep'){
            console.log(chalk.blue(util.format('[INFO/%s] Sleeping %o',tc.line, tc.data)));
            await sleep(tc.data)
            continue;
        }

        // if testcase type is context.
        if(tc.type == 'context'){
            console.log(chalk.green(util.format('[INFO/%s] Set Context %o',tc.line, tc.context)));
            Object.assign(context, tc.context);
            continue
        }

        try{
            if(tc.data){
                tc.data = render(tc.data, context);
                tc.data= JSON.parse(tc.data)
            }
        } catch(e){
            console.log(e);
            console.log(chalk.blue(util.format('[ERROR/%s] Invalid json payload:%s',tc.line, tc.data)));
            result.markFail();
        }
        try{
            tc.url = render(tc.url, context);
            console.log(chalk.hex('#454545')(util.format("\n[TEST/%s] Executing: %s",tc.line, tc.url)));
            //console.log(tc)

            var res = request(tc.method,tc.url , {
                json:tc.data
            });

            // We also needs to keep track status code
            if(res.statusCode != 200){
                console.log(chalk.red(util.format('[ERROR/%s] Error as res.statusCode :%s', tc.line, res.statusCode)));
                //fail_count++;
                //continue;
            }
            var resStr ="Unknwon resp"
            try{
               resStr = res.getBody('utf8');
            } catch(e){
               resStr = e.toString();
            }

            var matched ;
            try{
                matched = new namedRegexp(tc['expected']).exec(resStr);
            }
            catch(e){
                console.log(chalk.red(util.format("[INFO/%s] Invalid Reg Exp(marked failed): \n Invalid here: %s \n Trying to match: %s",tc.line, tc['expected'], resStr)));
                result.markFail()
                continue;
            }

            if(matched == null) {
                console.log(chalk.red(util.format('[ERROR/%s] Output and Expected different:\nUrl:%s\nExpected: %s\nOutput:%s', tc.line,tc.url,tc['expected'],resStr )));
                result.markFail()
                continue;
            }
            if(tc.type === 'tc'){
                console.log(chalk.green(util.format('[INFO/%s] Test passed',tc.line)));
                result.markPass()
            } else{
                console.log(chalk.blue(util.format('[INFO/%s] Setup request Success',tc.line)));
            }

            // Try Capture Context which will be used lateron.
            if(matched.groups() != null && Object.keys(matched.groups()).length > 0){
                Object.assign(context, matched.groups());
                console.log(chalk.blue(util.format("[INFO/%s] Updated context: %o",tc.line, matched.groups())));
                console.log(chalk.blue(util.format("[INFO/%s] New context: %o",tc.line, context)));
            }
        } catch(e){
            result.markFail();
            console.log(chalk.blue(util.format('[ERROR/%s] Test INFRA Exception: %s', tc.line, e)));
        }
    }
    result.printResult();
}

// Main function
console.log('Starting API Test...')
let context:Context = parseCommand();
var contents = fs.readFileSync(context.file, 'utf8');
var lines = contents.split("\n");
var lineIdx = 0;
if(program.line){
    console.log("Executing from Line: :"+program.line)
    lineIdx = parseInt(program.line) -1;
}
console.log(chalk.yellow(util.format("[INFO] Reading Test case %s",lines.length)));
var testcase:Array<TestCase> = []
for(;lineIdx<lines.length;lineIdx++){
    let line = lines[lineIdx]
    if(line.trim().length == 0){
        continue;
    }
    if(line[0] === '#'){
        continue;
    }
    testcase.push(build_test_from_line(line, lineIdx));
}
console.log(chalk.yellow(util.format("[INFO] Runnung test case now: %s",testcase.length)));
(async()=>{
    await run_test_case(testcase);
})()
