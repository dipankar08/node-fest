import { WebDriver, By, Key } from "selenium-webdriver";

declare module "selenium-webdriver" {
	export interface WebDriver {
		doType(target: String, text: string): Promise<void>;
		doTypeEnter(target: String, text: string): Promise<void>;
		doSingleClick(target: String): Promise<void>;
		assertElementVisible(target:String):Promise<void>;
	}
}

WebDriver.prototype.doType = async function (target: String, text: string) {
	const driver = this as WebDriver;
	await driver.findElement(resolveTarget(target)).sendKeys(text);
};
WebDriver.prototype.doTypeEnter = async function (target: String, text: string) {
	const driver = this as WebDriver;
	await driver.findElement(resolveTarget(target)).sendKeys(text+ Key.ENTER);
};

WebDriver.prototype.doSingleClick = async function (target: String) {
	const driver = this as WebDriver;
	await driver.findElement(resolveTarget(target)).click();
};

WebDriver.prototype.assertElementVisible = async function (target: String) {
	const driver = this as WebDriver;
	await (await driver.findElement(resolveTarget(target))).isDisplayed();
};

function resolveTarget(sel:String):By{
	if(sel.startsWith("id:")){
		return  By.id(sel.replace("id:",""));
	}
	if(sel.startsWith("name:")){
		return  By.name(sel.replace("name:",""));
	}
	return  By.id(sel.replace("id:",""));
}