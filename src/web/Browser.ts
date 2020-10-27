import * as webDriver from "selenium-webdriver";
import { Chrome } from "./Chrome";

export class Browser {
	private _browserType: EBrowserType;
	private _chromeInstance: Chrome;

	constructor(browserType: string) {
		this._browserType = (<any>EBrowserType)[browserType];
		this._chromeInstance = new Chrome();
	}

	public Initialize(): webDriver.WebDriver {
		var driver: webDriver.WebDriver;

		switch (this._browserType) {
			case EBrowserType.Chrome:
				driver = this._chromeInstance.Initialize();
				break;
			default:
				driver = this._chromeInstance.Initialize();
				break;
		}
		return driver;
	}
}

export enum EBrowserType {
	Chrome,
	Firefox,
}