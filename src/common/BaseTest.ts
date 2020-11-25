const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
import { IObject, TestCase } from "../types";
import { Result } from "./result";
import { captureContext, regexMatch, sleep } from "./utils";
const { render } = require('micromustache')
var request = require('sync-request');

export abstract class BaseTest {
    context: IObject = {};
    result: Result = new Result();
    cur_tc?: TestCase;

    abstract parseCommand(): IObject;
    abstract async executeTest(tc: TestCase): Promise<any>;

    // building testcase from file.
    buildTestFromFile(filepath: string): TestCase[] {
        var contents = ""
        try {
            contents = fs.readFileSync(filepath, 'utf8');
        } catch (err) {
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
            let is_setup = false
            if(command.indexOf("!") == 0){
                command = command.replace("!", "");
                is_setup = true;
            }
            let tc:TestCase = {
                line: lineNo,
                command: command,
                arguments: args.slice(1),
                is_setup:is_setup,
            }
            result.push(tc)
        }
        if (result.length == 0) {
            throw Error("No test case found");
        }
        console.log(chalk.yellow(util.format("[INFO] Total test case found ", result.length)));
        return result;
    }

    async runAllTestCase(testcase: Array<TestCase>) {
        this.result = new Result();
        for (let tc of testcase) {
            // replace arguments
            this.cur_tc = tc;
            tc.arguments = tc.arguments.map(x => render(x, this.context))
            this.result.markExecuting(tc);
            // Just handle common commands here.
            switch (tc.command) {
                case 'sleep':
                    console.log(chalk.blue(util.format('[INFO][%s] Sleeping %o', tc.line, tc.arguments[0])));
                    await sleep(parseInt(tc.arguments[0]))
                    break;
                case 'context':
                    this.context[tc.arguments[0]] = tc.arguments[1]
                    console.log(chalk.blue(util.format('[INFO][%s] Context Set: now %s', tc.line, JSON.stringify(this.context))));
                    break;
                case 'get':
                    await this.handleGet(tc.arguments, this.result);
                    break
                case 'post':
                    await this.handlePOST(tc.arguments, this.result);
                    break;
                default:
                    await this.executeTest(tc);
                    break
            }
        }
        this.result.printResult();
    }

    async main() {
        // Main function
        console.log('Starting API Test...')
        this.context = this.parseCommand();
        let testCases = this.buildTestFromFile(this.context.file);
        await this.runAllTestCase(testCases);
    }
    async handleGet(args:string[],ret:Result, ){
        let url = args[0];
        let expected = args[1]
        try{
            let observed = this.NetworkCall('GET', url,'')
            if(observed && regexMatch(expected, observed)){
                ret.markPass(this.cur_tc!);
                captureContext(expected, observed, this.context);
            }
        } catch(err){
            ret.markFail(this.cur_tc!, err.message)
        }
    }
    async handlePOST(args:string[],ret:Result ){
        let url = args[0];
        let data = args[1]
        let expected = args[2]
        try{
            let observed = this.NetworkCall('GET', url,JSON.stringify(data))
            if(observed && regexMatch(expected, observed)){
                ret.markPass(this.cur_tc!);
                captureContext(expected, observed, this.context);
            }
        } catch(err){
            ret.markFail(this.cur_tc!, err.message)
        }
    }
    
    NetworkCall(method:'GET'|'POST', url:string, json:string):string {
        var res = request(method,url , {
            json:json
        });
        var resStr =null;
        try{
           resStr = res.getBody('utf8');
        } catch(e){
           resStr = e.toString();
        }
        if(resStr){
            if(res.statusCode != 200){
                return `${resStr}(Error Code:${res.statusCode})`;
            } else {
                return resStr;
            }
        } else {
            throw new Error(`Server returns empty resp: ${url}`)
        }
    }
}