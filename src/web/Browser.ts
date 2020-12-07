// https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Your_own_automation_environment

export enum EBrowserType {
  Chrome,
  Firefox,
}
import { Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
import { IObject } from '../types';
const chromeDriver = require('chromedriver');
const geckodriver = require('geckodriver')
const windowSize = {
  width: 1920,
  height: 1080,
};

async function getChromeDriver(context:IObject): Promise<WebDriver> {
  const driverPath = chromeDriver.path;
  let chromeOption = new chrome.Options().windowSize(windowSize).addArguments('--incognito');
  updateOption(chromeOption, context);
  const driver = await new Builder()
    .withCapabilities(Capabilities.chrome())
    .setChromeService(new chrome.ServiceBuilder(driverPath))
    .setChromeOptions(chromeOption)
    .build();
  return driver as WebDriver;
}

async function getFireFoxDriver(context:IObject): Promise<WebDriver> {
  const driverPath = geckodriver.path
  let chromeOption = new firefox.Options().windowSize(windowSize).setPreference('browser.privatebrowsing.autostart', true);
  updateOption(chromeOption, context);
  const driver = await new Builder()
    .withCapabilities(Capabilities.firefox())
    .setFirefoxService(new firefox.ServiceBuilder(driverPath))
    .setFirefoxOptions(chromeOption)
    .build();
  return driver;
}

export async function getWebDriver(context: IObject): Promise<WebDriver> {
  switch (context.browser) {
    case EBrowserType.Chrome:
      return await getChromeDriver(context);
    case EBrowserType.Firefox:
      return await getFireFoxDriver(context);
    default:
      throw new Error(`Not support type ${context}.`);
  }
}

function updateOption(option:any, context: IObject) {
  //option.addArguments('disable-infobars');
  option.addArguments("--use-fake-ui-for-media-stream=1");
  if (context.headless) {
    option.addArguments('--headless');
    option.addArguments('--no-sandbox')
    option.addArguments("--start-maximized")
    option.addArguments("--window-size=1920,1080")
  }
  return option;
}
