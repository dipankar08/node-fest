import { TestCase } from "../types";

const util = require('util');
const chalk = require('chalk');
const format = require('string-format')

export class Result{
    markExecuting(tc: TestCase) {
        console.log(chalk.hex('#454545')(util.format("\n[INFO][%s] Executing: %s, %s", tc.line, tc.command, tc.arguments)));
    }
    pass_count:number  = 0
    fail_count:number =  0
    total_count:number = 0
    constructor(){

    }
    markPass(tc?:TestCase){
        this.pass_count++
        if(tc){
            console.log(chalk.green(`[PASS][${tc.line}] TEST PASS :)`));
        }
    }
    markFail(tc?:TestCase, msg?:string){
        this.fail_count++
        if(tc && msg){
            console.log(chalk.red(`[FAIL][${tc.line}] Test case failed: ${JSON.stringify(tc)}, msg: ${msg}`));
        }
    }
    printResult(){
        let result = util.format("\n\n\
        =======================================================\n\
                                SUMMARY                        \n\
        =======================================================\n\
        Pass Count: %s\n\
        Fail Count: %s\n\
        Total TC: %s\n\
        Pass Percentage: %s\%\n\
        =======================================================\
        ",this.pass_count, this.fail_count, this.pass_count+this.fail_count, (this.pass_count*100/(this.pass_count+this.fail_count)))
            if(this.fail_count == 0){
                console.log(chalk.green(result));
            } else{
                console.log(chalk.red(result));
            }
    }

}
