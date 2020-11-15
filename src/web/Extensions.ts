
import { WebDriver, By, Key, WebElement, } from "selenium-webdriver";
import { assert, sleep, sleepMS } from "../common/utils";

declare module "selenium-webdriver" {
	export interface WebDriver {
		doType(selector: String, text: string): Promise<void>;
		open(selector: String, window_name: string): Promise<void>;
		doTypeEnter(selector: String, text: string): Promise<void>;
		doSingleClick(selector: String): Promise<void>;

		assertElementVisible(selector: String): Promise<void>;
		verifyBodyText(selector: String, text: string): Promise<void>;
		verifyNoBodyText(selector: String, text: string): Promise<void>;
		assertAttr(selector: String, attrKey: string, attrValue: string): Promise<void>;
		setAttr(selector: String, attrKey: string, attrValue: string): Promise<void>;
		cookie(action: string, key: string, value?: string): Promise<void>;
		doAlert(selector: String): Promise<void>;
		doReset(): Promise<void>;
		switchX(win: string): Promise<void>;
	}
}

WebDriver.prototype.cookie = async function (action: string, key: string, value?: string) {
	const driver = this as WebDriver;
	switch (action) {
		case 'verify':
			var val = undefined;
			try {
				val = await driver.manage().getCookie(key);
				assert(val.value == value, `[Cookie] Expected:<${value}>, Observed:<${val.value}>`)
			} catch (err) {
				assert('undefined' == value, `[Cookie] Expected:<${value}>, Observed:<${'undefined'}>`)
			}
			break;
		case 'set':
			try {
				await driver.manage().addCookie({ name: key, value: value!, domain: new URL(await driver.getCurrentUrl()).hostname })
			} catch (err) {
				console.log("[COOKIE] Not able to set cookie due to " + err)
			}
			break;
		case 'delete':
			await driver.manage().deleteCookie(key);
			break;
		default:
			assert(false, `[Cookie] UnExpected action:<${action}>`)
	}
};

let winHandleMap: any = {}

WebDriver.prototype.switchX = async function (window_name: string) {
	let handle = winHandleMap[window_name];
	const driver = this as WebDriver;
	await driver.switchTo().window(handle);
	await sleep(2)
}

WebDriver.prototype.open = async function (url: string, window_name: string) {
	const driver = this as WebDriver;
	if(window_name == 'main'){
		await driver.executeScript(`window.open('${url}')`)
	} else {
		await driver.executeScript(`window.open('${url}','_blank')`)
	}
	// Wait 500ms to open the page
	await sleepMS(500);

	// update map
	let allHandles = await driver.getAllWindowHandles()
	let this_handle = allHandles[allHandles.length - 1]
	winHandleMap[window_name] = this_handle;
	console.log(winHandleMap);
	await this.switchX(window_name);
	try {
		await driver.manage().addCookie({ name: 'debug', value: '1', domain: new URL(await driver.getCurrentUrl()).hostname })
	} catch (err) {
		console.log('[open] Not able to set cookie while open')
	}
};
WebDriver.prototype.doType = async function (selector: string, text: string) {
	const driver = this as WebDriver;
	let ele = await resolveElement(driver, selector)
	await ele.clear()
	await ele.sendKeys(text);
};
WebDriver.prototype.doTypeEnter = async function (selector: string, text: string) {
	const driver = this as WebDriver;
	let ele = await resolveElement(driver, selector)
	await ele.clear()
	await ele.sendKeys(text + Key.ENTER);
};
WebDriver.prototype.doReset = async function () {
	const driver = this as WebDriver;
	await driver.manage().deleteAllCookies();
	console.log("You have deleted all the cookies")
};



WebDriver.prototype.doSingleClick = async function (selector: string) {
	const driver = this as WebDriver;
	await sleep(1)
	await (await resolveElement(driver, selector)).click();
};

WebDriver.prototype.doAlert = async function (action: String) {
	const driver = this as WebDriver;
	sleep(5)
	// working with alerts.
	try {
		let alert = await driver.switchTo().alert();
		if (action == "ok") {
			// for clicking on ok button
			alert.accept();
		} else if (action == 'cancel') {
			// for clicking on cancel button
			alert.dismiss();
		} else {
			throw (`[Alert] You must pass either <alert:ok> or <alert:cancel>`)
		}
	} catch (e) {
		throw (`[Alert] You must pass either <alert:ok> or <alert:cancel> Error: ${e}`)
	}
}



WebDriver.prototype.assertElementVisible = async function (selector: string) {
	const driver = this as WebDriver;
	await (await resolveElement(driver, selector)).isDisplayed();
};
WebDriver.prototype.assertAttr = async function (selector: string, attrKey: string, attrValue: string) {
	const driver = this as WebDriver;
	let ele = await resolveElement(driver, selector)
	let value = await ele.getAttribute(attrKey)
	if (value == attrValue) {
		console.log("assertAttr: PASS")
	} else {
		throw `assertAttr fails for ${selector}, Found : ${value} where as Expected: ${attrValue}`
	}
};

WebDriver.prototype.setAttr = async function (selector: string, attrKey: string, attrValue: string) {
	const driver = this as WebDriver;
	var str = `document.querySelector('${selector}').setAttribute('${attrKey}', '${attrValue}')`
	executeScript(driver, str);
};


function executeScript(driver: WebDriver, script: string) {
	console.log(`[executeScript] <${script}>`)
	driver.executeScript(script);
}

WebDriver.prototype.verifyBodyText = async function (selector: string, text: string) {
	const driver = this as WebDriver;
	let title = await driver.getTitle()
	await sleep(1)
	let data = await resolveElementAll(driver, selector)
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
		//console.log("verifyBodyText: PASS")
		return
	} else {
		//console.log(data)
		//console.log(data1)
		throw `[verifyBodyText] this fails  as we are not able to find <${text}> in the selector <${selector}>`
	}
};

WebDriver.prototype.verifyNoBodyText = async function (selector: string, text: string) {
	const driver = this as WebDriver;
	await sleep(1)
	let data = await resolveElementAll(driver, selector);
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
		throw `[verifyNoBodyText] failed as We are able to find the test <${text}> in the selector  <${selector}>.`
	} else {
		return;
	}
};


async function resolveElementAll(driver: WebDriver, sel: string): Promise<WebElement[]> {
	try {
		let val: WebElement[] = await driver.findElements(By.css(sel))
		if (val.length > 0) {
			return val;
		} else {
			throw `[resolveElementAll] Not able to find selector in the webpage for <${sel}> `
		}
	} catch (error) {
		throw `[resolveElementAll] Not able to find selector in the webpage for <${sel}> `
	}
}

async function resolveElement(driver: WebDriver, sel: string): Promise<WebElement> {
	try {
		let val: WebElement[] = await driver.findElements(By.css(sel))
		if (val.length > 0) {
			return val[0];
		} else {
			throw `[resolveElement] Not able to find selector in the webpage for <${sel}> `
		}
	} catch (error) {
		throw `[resolveElement] Not able to find selector in the webpage for <${sel}> `
	}
}