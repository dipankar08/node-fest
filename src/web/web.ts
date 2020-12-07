import { BaseTest } from '../common/BaseTest';
import { assert, sleep, sleepMS } from '../common/utils';
import { WebDriver} from 'selenium-webdriver';
import './Extensions';
import _ = require('underscore');
import {TestCase } from '../types';
import { getWebDriver } from './Browser';
class WSTest extends BaseTest {
  addMoreOption(p: any) {
    p.option('-hl, --headless <headless>', 'Run with headless browser');
    p.option('-q, --quit <quit>', 'pass this argument if you want to quit the browner at end');
    p.option('-b, --browser <browser>', 'Pass chrome or firefox');
  }
  modifyContextForDebug() {
    this.context.file = '/Users/dip/dipankar/node-fest/src/web/sample.txt';
    //this.context.browser = "firefox";
    //this.context.line = 10;
    //this.context.limit = 2;
    // context.headless = false
    // context.quit = false;
  }

  async onBeforeExecuteTest() {
    this.context.driver = await getWebDriver(this.context);
    await this.context.driver.manage().window().maximize();
  }

  async onAfterExecuteTest(){
    if (this.context.quit) {
        if (this.context.headless == false) {
            await sleep(3); // 3 sec to check
        }
        this.context.driver?.quit()
    }
  }

  // executing test case...
  async executeTest(tc: TestCase) {
    let driver: WebDriver = this.context.driver as WebDriver;
    switch (tc.command) {
      case 'open':
        if (tc.arguments.length == 1) {
          tc.arguments.push('main');
        }
        await driver.open(tc.arguments[0], tc.arguments[1]);
        this.result.markPass(tc);
        break;
      case 'verifyBodyText':
        await driver.verifyBodyText('body', tc.arguments[0]);
        this.result.markPass(tc);
        break;
      case 'verifyNoBodyText':
        await driver.verifyNoBodyText('body', tc.arguments[0]);
        this.result.markPass(tc);
        break;
      case 'verifyAttr':
        await driver.assertAttr(tc.arguments[0], tc.arguments[1], tc.arguments.slice(2)[0]);
        this.result.markPass(tc);
        break;
      case 'setAttr':
        await driver.setAttr(tc.arguments[0], tc.arguments[1], tc.arguments.slice(2)[0]);
        this.result.markPass(tc);
        break;
      case 'verifyText':
        await driver.verifyBodyText(tc.arguments[0], tc.arguments.slice(1)[0]);
        this.result.markPass(tc);
        break;
      case 'verifyTitle':
        let title = await driver.getTitle();
        assert(title == tc.arguments[0], `[${tc.line}] Failed! Expected:<${tc.arguments[0]}> Observed: <${title}>`);
        this.result.markPass(tc);
        break;
      case 'click':
        await driver.doSingleClick(tc.arguments[0]);
        break;
      case 'clickWaitVerify':
        await driver.doSingleClick(tc.arguments[0]);
        await sleepMS(parseInt(tc.arguments[1]));
        await driver.verifyBodyText('body', tc.arguments[2]);
        this.result.markPass(tc);
        break;
      case 'input':
        await driver.doType(tc.arguments[0], tc.arguments.slice(1)[0]);
        break;
      case 'inputWithEnter':
        await driver.doTypeEnter(tc.arguments[0], tc.arguments.slice(1)[0]);
        break;
      case 'alert':
        await driver.doAlert(tc.arguments[0]);
        break;

      case 'cookie':
        await driver.cookie(tc.arguments[0], tc.arguments[1], tc.arguments[2]);
        if (tc.arguments[0] == 'verify') {
          this.result.markPass(tc);
        }
        break;
      case 'reset':
        await driver.doReset();
        break;
      case 'switch':
        await driver.switchX(tc.arguments[0]);
        break;

      default:
        assert(false, `[${tc.line}] Invalid command: <${tc.command}>`);
    }
  }
}

(async () => {
  let mWSTest = new WSTest();
  await mWSTest.main();
})();
