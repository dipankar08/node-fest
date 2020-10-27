
import { Options } from "selenium-webdriver/chrome";
const chromeDriver = require('chromedriver');
import { setDefaultService, ServiceBuilder } from 'selenium-webdriver/chrome';
import { WebDriver, Builder, Capabilities } from "selenium-webdriver";
export class Chrome {
    constructor() {
        let driverPath = chromeDriver.path;
        let service = new ServiceBuilder(driverPath).build();
        setDefaultService(service);
    }
    public Initialize(): WebDriver {
        let chromeOptions = new Options();
        chromeOptions.addArguments('disable-infobars');
        chromeOptions.addArguments("--use-fake-ui-for-media-stream=1");
        let browser = new Builder()
            .withCapabilities(Capabilities.chrome())
            .setChromeOptions(chromeOptions)
            .build();
        return browser;
    }
}