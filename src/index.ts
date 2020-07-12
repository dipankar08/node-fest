import { WebDriver, By, Key } from "selenium-webdriver";
import { assert } from "chai";
import { Browser } from "./Browser";
import "./Extensions"
let browser: Browser = new Browser("Chrome");

(async function(){
    let driver = browser.Initialize()
    await driver.manage().window().maximize();
           // await driver.doTypeEnter("name:q", "searchText");
        //await driver.assertElementVisible("id:result-stats")
    try{
        await driver.doNavigate('https://code.codersheet.co/');
        await driver.assertTextVisible("tag:p","Looks like you are not passing any pad-id")

        await driver.doNavigate('https://code.codersheet.co/?id=123');
        await driver.assertTextVisible("tag:body","This interview doesnt exist !")

        await driver.doNavigate('https://code.codersheet.co/?id=5ed2e332d88a8b46ab3b770e');
        await driver.assertTextVisible("tag:body","Start at Anytime")

        await driver.doSingleClick("tag:button")
        
        console.log("Quit")
        driver.quit()
    } catch(err){
        console.log(`Failed... with error ${err}`)
    }
})();