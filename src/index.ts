import { WebDriver, By, Key } from "selenium-webdriver";
import { assert } from "chai";
import { Browser } from "./Browser";
import "./Extensions"
let browser: Browser = new Browser("Chrome");

(async function(){
    let driver = browser.Initialize()
    try{
        await driver.manage().window().maximize();
        await driver.navigate().to('http://google.com');
        await driver.doTypeEnter("name:q", "searchText");
        await driver.assertElementVisible("id:result-stats")
        console.log("Quit")
    } catch(err){
        console.log(`Failed... with error ${err}`)
    }
     driver.quit()
})();