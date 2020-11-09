// https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/Your_own_automation_environment

export enum EBrowserType {
  Chrome,
  Firefox,
}
import * as path from 'path';
import { Builder, Capabilities, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
import { Options } from "selenium-webdriver/firefox";
const chromeDriver = require('chromedriver');
import { Context } from './web';
const geckodriver = require('geckodriver')
const windowSize = {
  width: 1920,
  height: 1080,
};

async function getChromeDriver(): Promise<WebDriver> {
  const driverPath = chromeDriver.path;
  const driver = await new Builder()
    .withCapabilities(Capabilities.chrome())
    .setChromeService(new chrome.ServiceBuilder(driverPath))
    .setChromeOptions(
      new chrome.Options().windowSize(windowSize).addArguments('--incognito'),
    )
    .build();
  return driver;
}

async function getFireFoxDriver(): Promise<WebDriver> {
  const driverPath = geckodriver.path
  const driver = await new Builder()
    .withCapabilities(Capabilities.firefox())
    .setFirefoxService(new firefox.ServiceBuilder(driverPath))
    .setFirefoxOptions(
      new firefox.Options().windowSize(windowSize)
        .setPreference('browser.privatebrowsing.autostart', true)
    )
    .build();
  return driver;
}

export async function getWebDriver(context: Context): Promise<WebDriver> {
  switch (context.browser) {
    case EBrowserType.Chrome:
      return getChromeDriver();
    case EBrowserType.Firefox:
      return getFireFoxDriver();
    default:
      throw new Error(`Not support type ${context}.`);
  }
}

function getOptions(context: Context) {
  let option = new Options();
  option.addArguments('disable-infobars');
  option.addArguments("--use-fake-ui-for-media-stream=1");
  if (context.headless) {
    option.addArguments('--headless');
    option.addArguments('--no-sandbox')
    option.addArguments("--start-maximized")
    option.addArguments("--window-size=1920,1080")
  }
  return option;
}
