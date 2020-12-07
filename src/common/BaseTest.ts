const fs = require('fs');
const chalk = require('chalk');
const util = require('util');
import { program } from 'commander';
import { IObject, TestCase } from '../types';
import { EBrowserType } from '../web/Browser';
import { Result } from './result';
import { captureContext, regexMatch, sleep, sleepMS } from './utils';
const { render } = require('micromustache');
var request = require('sync-request');

function filterhashComments(line: string) {
  if (line.indexOf('#') != -1) {
    let prevChar = '';
    let fline = '';
    for (var i = 0; i < line.length; i++) {
      if (line[i] == '#' && prevChar != '\\') {
        break;
      }
      if (line[i] == '\\') {
        if (line[i + 1] != '#') {
          fline += line[i];
        }
      } else {
        fline += line[i];
      }
      prevChar = line[i];
    }
    line = fline;
  }
  return line;
}
export abstract class BaseTest {
  context: IObject = {};
  result: Result = new Result();
  cur_tc?: TestCase;

  // Optical to be override ..
  modifyContextForDebug() {}
  addMoreOption(p: any) {}
  async onBeforeExecuteTest() {} // This function to be called to execute any test
  async onAfterExecuteTest(){}

  parseCommand() {
    let p = program
      .option('-s, --server <url>', 'server endpoints')
      .option('-f, --file <path>', 'path of the test file')
      .option('-l, --line <line>', 'It will execute that number only.')
      .option('-lm, --limit <limit>', 'It will execute this many test from that line.');

    this.addMoreOption(p);

    p.parse(process.argv);
    this.context.file = program.file;
    this.context.server = program.server;
    this.context.line = program.line;
    this.context.limit = program.limit;

    this.context.headless = program.headless ? program.headless == 'true' : true;
    this.context.quit = program.quit ? program.quit == 'true' : true;
    this.context.browser = program.browser == 'firefox' ? EBrowserType.Firefox : EBrowserType.Chrome;

    // debug override
    if (process.env.vs_debug == 'true') {
      this.modifyContextForDebug();
    }
    console.log(`Context: ${JSON.stringify(this.context)}`);
  }
  abstract async executeTest(tc: TestCase): Promise<any>;

  // building testcase from file.
  buildTestFromFile(filepath: string): TestCase[] {
    var contents = '';
    try {
      contents = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      throw new Error('[Error] You must pass the test-file path in the command like -f ./textcase.txt');
    }

    var lines = contents.split('\n');
    let result = Array<TestCase>();
    for (var i = 0; i < lines.length; i++) {
      var line: string = lines[i].trim();
      if (line[0] == '#') {
        continue;
      }
      // trim the comments
      line = filterhashComments(line);
      if (line.length == 0) {
        continue;
      }
      var lineNo = i + 1;
      let args = line
        .split('=>')
        .map((x) => x.trim())
        .filter((y) => y.length > 0);
      let command = args[0];
      let is_setup = false;
      if (command.indexOf('!') == 0) {
        command = command.replace('!', '');
        is_setup = true;
      }
      let tc: TestCase = {
        line: lineNo,
        command: command,
        arguments: args.slice(1),
        is_setup: is_setup,
      };
      result.push(tc);
    }
    if (result.length == 0) {
      throw Error('No test case found');
    }
    console.log(chalk.yellow(util.format('[INFO] Total test case found ', result.length)));
    return result;
  }

  async runAllTestCase(testcase: Array<TestCase>) {
    console.log(chalk.blue(`[INFO] Running ${testcase.length} test cases.`));
    this.result = new Result();
    await this.onBeforeExecuteTest();
    for (let tc of testcase) {
      // replace arguments
      this.cur_tc = tc;
      tc.arguments = tc.arguments.map((x) => render(x, this.context));
      this.result.markExecuting(tc);
      // Just handle common commands here.
      switch (tc.command) {
        case 'sleep':
          console.log(chalk.blue(util.format('[INFO][%s] Sleeping %o', tc.line, tc.arguments[0])));
          await sleep(parseInt(tc.arguments[0]));
          break;
        case 'sleep_ms':
          console.log(chalk.blue(util.format('[INFO][%s] Sleeping %o', tc.line, tc.arguments[0])));
          await sleepMS(parseInt(tc.arguments[0]));
          break;

        case 'context':
          this.context[tc.arguments[0]] = tc.arguments[1];
          console.log(chalk.blue(util.format('[INFO][%s] Context Set: now %s', tc.line, JSON.stringify(this.context))));
          break;
        case 'get':
          await this.handleGet(tc.arguments, this.result);
          break;
        case 'post':
          await this.handlePOST(tc.arguments, this.result);
          break;
        default:
          await this.executeTest(tc);
          break;
      }
    }
    this.result.printResult();
    this.onAfterExecuteTest();
  }

  async main() {
    // Main function
    console.log('Starting API Test...');
    this.parseCommand();
    let testCases = this.buildTestFromFile(this.context.file);
    if (this.context.line != undefined) {
      testCases = testCases.filter((x) => x.line >= this.context.line);
    }
    if (this.context.limit != undefined) {
      testCases = testCases.slice(0, this.context.limit);
    }
    await this.runAllTestCase(testCases);
  }
  async handleGet(args: string[], ret: Result) {
    let url = args[0];
    let expected = args[1];
    try {
      let observed = this.NetworkCall('GET', url, '');
      if (observed && regexMatch(expected, observed)) {
        ret.markPass(this.cur_tc!);
        captureContext(expected, observed, this.context);
      } else {
        ret.markFail(this.cur_tc!, `Failed due to Response Mismatch: Expected:<${expected}>, observed:<${observed}>`);
      }
    } catch (err) {
      ret.markFail(this.cur_tc!, err.message);
    }
  }
  async handlePOST(args: string[], ret: Result) {
    let url = args[0];
    let data = args[1];
    let expected = args[2];
    try {
      let observed = this.NetworkCall('POST', url, data);
      if (observed && regexMatch(expected, observed)) {
        ret.markPass(this.cur_tc!);
        captureContext(expected, observed, this.context);
      } else {
        ret.markFail(this.cur_tc!, `Failed due to Response Mismatch: Expected:<${expected}>, observed:<${observed}>`);
      }
    } catch (err) {
      ret.markFail(this.cur_tc!, err.message);
    }
  }

  NetworkCall(method: 'GET' | 'POST', url: string, json: string): string {
    if (method == 'POST') {
      try {
        json = JSON.parse(json);
      } catch (err) {
        return err.message;
      }
    }
    var res = request(method, url, {
      json: json,
    });
    var resStr = null;
    try {
      resStr = res.getBody('utf8');
    } catch (e) {
      resStr = e.toString();
    }
    if (resStr) {
      if (res.statusCode != 200) {
        return `${resStr}(Error Code:${res.statusCode})`;
      } else {
        return resStr;
      }
    } else {
      throw new Error(`Server returns empty resp: ${url}`);
    }
  }
}
