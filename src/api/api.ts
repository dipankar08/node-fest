#!/usr/bin/env node
import { BaseTest } from "../common/BaseTest";
import { assert } from "../common/utils";
import { IObject, TestCase } from "../types";
var program = require('commander');
class WSTest extends BaseTest {
    parseCommand(): IObject {
        var context: any = {}
        program
            .option('-s, --server <url>', 'server endpoints')
            .option('-f, --file <path>', 'path of the test file')
            .option('-l, --line <line_number>', 'It will execute that number only.')
            .parse(process.argv);
        context.file = program.file
        context.server = program.server
        // debug override
        // context.file = "/Users/dip/dipankar/node-fest/src/api/sample.txt"
        return context;
    }

    // executing test case...
    async executeTest(tc: TestCase) {
        switch (tc.command) {
            case 'GET':
                this.handleGet(tc.arguments, this.result);
                break;
            case 'POST':
                this.handlePOST(tc.arguments, this.result);
                break;
            default:
                assert(false, `[${tc.line}] Invalid command: <${tc.command}>`)
        }
    }
}

(async () => {
    let mWSTest = new WSTest();
    await mWSTest.main();
})();