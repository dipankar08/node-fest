const util = require('util');
const chalk = require('chalk');

class Result{
    pass_count:number  = 0
    fail_count:number =  0
    total_count:number = 0
    constructor(){

    }
    markPass(){
        this.pass_count++
    }
    markFail(){
        this.fail_count++
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
