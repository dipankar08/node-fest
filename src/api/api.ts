#!/usr/bin/env node
import { BaseTest } from "../common/BaseTest";
import { assert } from "../common/utils";
import { IObject, TestCase } from "../types";
var program = require('commander');
class WSTest extends BaseTest {
    modifyContextForDebug() {
          this.context.file = "/Users/dip/dipankar/node-fest/src/api/sample.txt"
          //this.context.line = 10;
          //this.context.limit = 2;
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