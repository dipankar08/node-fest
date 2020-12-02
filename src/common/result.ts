import { TestCase } from "../types";

const util = require('util');
const chalk = require('chalk');
const format = require('string-format')

export class Result {
    markExecuting(tc: TestCase) {
        console.log(chalk.hex('#454545')(util.format("\n[INFO][%s] Executing: %s, %s", tc.line, tc.command, tc.arguments)));
    }
    pass_count: number = 0
    fail_count: number = 0
    total_count: number = 0
    fail_tests:TestCase[] = [];
    constructor() {

    }
    markPass(tc: TestCase) {
        if (!tc.is_setup) {
            this.pass_count++
        }
        if (tc) {
            console.log(chalk.green(`[PASS][${tc.line}] TEST PASS :)`));
        }
    }
    markFail(tc: TestCase, msg?: string) {
        if (!tc.is_setup) {
            this.fail_count++
        }
        if (tc && msg) {
            console.log(chalk.red(`[FAIL][${tc.line}] Test case failed: ${JSON.stringify(tc)}, msg: ${msg}`));
        }
        tc.error_msg = msg?.slice(0,300); // just take 300 char
        this.fail_tests.push(tc)
    }
    printResult() {
        let result = util.format("\n\n\
        =======================================================\n\
                                SUMMARY                        \n\
        =======================================================\n\
        Pass Count: %s\n\
        Fail Count: %s\n\
        Total TC: %s\n\
        Pass Percentage: %s\%\n\
        =======================================================\
        ", this.pass_count, this.fail_count, this.pass_count + this.fail_count, (this.pass_count * 100 / (this.pass_count + this.fail_count)))
        if (this.fail_count == 0) {
            console.log(chalk.green(result));
        } else {
            console.log(chalk.red(result));
        }
        if(this.fail_tests.length > 0){
            console.log(chalk.red(`
=====================================================
   YOU HAVE FAILED TEST! FIX PLEASE BEFORE CHECK IN
=====================================================            
${this.fail_tests.map(x=> JSON.stringify(x)).join('\n')}
=====================================================`));

        }
    }
}
