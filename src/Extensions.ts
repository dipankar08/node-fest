import { WebDriver, By, Key } from "selenium-webdriver";

declare module "selenium-webdriver" {
	export interface WebDriver {
		doType(target: String, text: string): Promise<void>;
		doNavigate(target: String): Promise<void>;
		doTypeEnter(target: String, text: string): Promise<void>;
		doSingleClick(target: String): Promise<void>;

		assertElementVisible(target: String): Promise<void>;
		assertTextVisible(target: String, text: string): Promise<void>;
		assertNoTextVisible(target: String, text: string): Promise<void>;
		assertAttr(target: String, attrKey: string, attrValue: string): Promise<void>;
		doAlert(target: String): Promise<void>;
		doReset(): Promise<void>;
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
	await driver.findElement(resolveTarget(target)).sendKeys(text + Key.ENTER);
};
WebDriver.prototype.doReset = async function () {
	const driver = this as WebDriver;
	await driver.manage().deleteAllCookies();
	console.log("You have deleted all the cookies")
};



WebDriver.prototype.doSingleClick = async function (target: String) {
	const driver = this as WebDriver;
	await sleep(1 * 1000)
	await driver.findElement(resolveTarget(target)).click();
};

WebDriver.prototype.doAlert = async function (action: String) {
	const driver = this as WebDriver;
	sleep(500)
	// working with alerts.
	try{
		let alert = await driver.switchTo().alert();
		if (action == "ok") {
			// for clicking on ok button
			alert.accept();
		} else if (action == 'cancel') {
			// for clicking on cancel button
			alert.dismiss();
		} else {
			throw ("Inavlid Alert or you send a wrong command")
			this.doAlert(action)
		}
	} catch(e){

	}
	/*
	// for getting alert text message
	alert.getText();
	// for sending some text inside the alert
	alert.sendKeys("alert string");
	*/
}



WebDriver.prototype.assertElementVisible = async function (target: String) {
	const driver = this as WebDriver;
	await (await driver.findElement(resolveTarget(target))).isDisplayed();
};
WebDriver.prototype.assertAttr = async function (target: String, attrKey: string, attrValue: string) {
	const driver = this as WebDriver;
	let ele = await driver.findElement(resolveTarget(target))
	let value = await ele.getAttribute(attrKey)
	if (value == attrValue) {
		console.log("assertAttr: PASS")
	} else {
		throw `assertAttr fails for ${target}, Found : ${value} where as Expected: ${attrValue}`
	}
};

WebDriver.prototype.assertTextVisible = async function (target: string, text: string) {
	const driver = this as WebDriver;
	await sleep(1 * 1000)
	let data = await driver.findElements(resolveTarget(target))
	var data1 = ''
	//console.log(data)
	for (let x of data) {
		if (x.isDisplayed()) {
			var t = await x.getText()
			data1 += t
		}
	}

	let data2 = data1.toLowerCase()
	let text2 = text.toLowerCase()
	if (data2.indexOf(text2) != -1) {
		//console.log("assertTextVisible: PASS")
		return
	} else {
		//console.log(data)
		//console.log(data1)
		throw `assertTextVisible fails for ${target} for text ${text}`
	}
};

WebDriver.prototype.assertNoTextVisible = async function (target: string, text: string) {
	const driver = this as WebDriver;
	await sleep(1 * 1000)
	let data = await driver.findElements(resolveTarget(target))
	var data1 = ''
	//console.log(data)
	for (let x of data) {
		if (x.isDisplayed()) {
			var t = await x.getText()
			data1 += t
		}
	}
	let data2 = data1.toLowerCase()
	let text2 = text.toLowerCase()
	if (data2.indexOf(text2) != -1) {
		throw `assertNoTextVisible fails for ${target} for text ${text}`
	} else {
		return;
	}
};

function resolveTarget(sel: String): By {
	if (sel.startsWith("id_")) {
		return By.id(sel.replace("id_", ""));
	}
	if (sel.startsWith("name_")) {
		return By.name(sel.replace("name_", ""));
	}
	if (sel.startsWith("class_")) {
		return By.className(sel.replace("class_", ""));
	}
	if (sel.startsWith("tag_")) {
		return By.tagName(sel.replace("tag_", ""));
	}
	if (sel.startsWith("css_")) {
		return By.css(sel.replace("css_", ""));
	}
	throw "Invalid Target found" + sel
}

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}