
const util = require('util');
import chalk = require("chalk");
import request from "sync-request";
import { IObject } from "../types";
var namedRegexp = require("named-js-regexp");

// helper
export function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}
export function sleepMS(s: number) {
    return new Promise(resolve => setTimeout(resolve, s));
}

export function callNetwork(type: 'GET' | 'POST', url: string, data: any): string {
    var res = request(type, url, data);
    // We also needs to keep track status code
    if (res.statusCode != 200) {
        throw Error(`[callNetwork] Issue with network request as <${res.statusCode}> for url:${url}, data:<${data} >`);
    }
    try {
        return res.getBody('utf8');
    } catch (e) {
        return e.toString();
    }
}

export function assert(cond: boolean, error: string) {
    if (!cond) {
        throw Error(error)
    }
}

export function captureContext(template:string, string:string, context:IObject):boolean{
    var matched ;
    try{
        matched = new namedRegexp(template).exec(string);
    }
    catch(e){
        return false;
    }
    if(matched == null) {
        return false;
    }
     // Try Capture Context which will be used lateron.
     if(matched.groups() != null && Object.keys(matched.groups()).length > 0){
        Object.assign(context, matched.groups());
        console.log(chalk.blue(util.format('[INFO] Context updated: now %s', JSON.stringify(context))));
        return true;
    }
    return false
}

export function regexMatch(reg: string, str: string): false | Object {
    var matched;
    try {
        matched = new namedRegexp(reg).exec(str);
    } catch (e) {
        console.log(`[regexMatch] Invalid regex: < ${reg} >`)
        return false
    }
    if (matched == null) {
        return false;
    }
    return matched;
}

// JS default is not works for replace all.
// NOT WORKING
export function replaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(find, 'g'), replace);
}
// SplitX allows to split around a character where you can mark as escape character if needed.abs
// NOT WORKING,.
export function splitX(str: string, dilim:string) {
    let data = str.match(/(\\.|[^,])+/g)
    if (data == null) {
        return []
    }
   // return data.map(x => replaceAll(x, "\\\\,", ",").trim())
    return data.map(x => x.replace("\\\\,", ",").trim())
}




