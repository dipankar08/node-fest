import { WebDriver, By, Key } from "selenium-webdriver";

declare module "selenium-webdriver" {
	export interface WebDriver {
		doType(target: String, text: string): Promise<void>;
		doNavigate(target:String):Promise<void>;
		doTypeEnter(target: String, text: string): Promise<void>;
		doSingleClick(target: String): Promise<void>;

		assertElementVisible(target:String):Promise<void>;
		assertTextVisible(target:String, text:string):Promise<void>;
	}
}
WebDriver.prototype.doNavigate = async function (target: string) {
	const driver = this as WebDriver;
	await driver.navigate().to(target);
};
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

WebDriver.prototype.assertTextVisible = async function (target: string, text:string) {
	const driver = this as WebDriver;
	await sleep(2*1000)
	let data = await driver.findElements(resolveTarget(target))
	var data1 =''
	//console.log(data)
	for(let x of data){
		if(x.isDisplayed()){
		var t = await x.getText()
		data1 += t
		}
	}

    if((data1.toLowerCase().includes(text.toLowerCase()))){
		console.log("assertTextVisible: PASS")
	} else {
		console.log(data)
		console.log(data1)
		throw `assertTextVisible fails for ${target}`
	}
};

function resolveTarget(sel:String):By{
	if(sel.startsWith("id:")){
		return  By.id(sel.replace("id:",""));
	}
	if(sel.startsWith("name:")){
		return  By.name(sel.replace("name:",""));
	}
	if(sel.startsWith("class:")){
		return By.className(sel.replace("class:",""));
	}
	if(sel.startsWith("tag:")){
		return By.tagName(sel.replace("tag:",""));
	}
	return  By.id(sel.replace("id:",""));
}

function sleep(ms:number) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }