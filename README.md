## Motivation.
Welcome to Node-Fest : The Fastest E2E Framework for Software blackbox testing.

> Node-fest provides simplest unified automation framework for API, WEB, Android, IOS and WS testing.Yyou can write a high-quality e2e automation test in a very simple compact way without any code. 

## Features:
* Allow to be extermely productive - You can write 100 of E2E per hours 
* Write exteramlly compact test with with few possible charecter(Everyline of the textcase file should be one complete test case)
* Allow write test without any code - You just need to follow some syntax.
* it takes 1/10000000 efforts to write a testcase than the feature dev.

## Installation:
sudo npm install node-fest -g

## Testing APIs

## Testing Web
Using node-fest, you would be super productive while writing a test case for your product. First, You should create a test case file which holds all the test case. Then, you should keep writing test -cases in that file.
Each testcase consist of number of instruction separated by =>. So thus it looks like like insertion1 => instruction2 => instruction3.
Each instruction consists of ACTION:TARGET: ARGUMENTS. For example, open:https://google.com will open google. The documentation of instruction sets is given below: 
```
## Sample comments
##
## Note: We use two # to indicate comments as a single hash can be inside selector
##/////////////////

open, http://127.0.0.1:5500/src/web/sample.html   ## Please make sure you run the live server from the VS code.

## TEST


## Validate Text.
=> verifyBodyText,  verifyBodyText  ## This text is present
=> verifyNoBodyText,  verifyNoXXXBodyText ## This text is not present
=> verifyText, .a,  classA  ## This text is present
=> verifyText, .b,  classB  ## This text is present
=> verifyText, #c,  IdC   ## This text is present
=> verifyText, #d .c p,  Id_D_CLASS_C_TAG_P  ## This text is present
=> wait, 500 ## wait for 500 ms

## Action
=> click, #act1 button
=> verifyBodyText,  Button clicked 1 
=> click, #act1 button
=> click, #act1 a
=> verifyBodyText,  Button clicked 2
=> clickWaitVerify,  #act1 button,  10,  Button clicked 3
=> clickWaitVerify,  #act1 button,  10,  Button clicked 4

## Inputs
=> input,  #inp1 input,  hello
=> clickWaitVerify,  #inp1 button,  10,  input is hello
=> input,  #inp1 input,  hello2
=> clickWaitVerify,  #inp1 button,  10,  input is hello2
=> inputWithEnter,  #inp1 input,  hello3
=> verifyBodyText,  input is hello3


## Attribute
=> verifyAttr, #atr1 a, href, https://google.com/
=> setAttr, #atr1 a, href, https://yahoo.com/
=> verifyAttr, #atr1 a, href, https://yahoo.com/

## alert
=> click, #alert button
=> alert, ok
=>verifyBodyText, alert return ok
=> click, #alert button
=> alert, cancel
=>verifyBodyText, alert return cancel

## Cookie
=> cookie, verify, debug, 1         ## By default you have a cookie for debug as 1
=> cookie, set, name, dipankar      ## Setting a cookie
=> cookie, verify, name, dipankar   ## getting a cookie
=> cookie, delete, name            ## Delete a cookie
=> cookie, verify, name, undefined  ## After delete,  please verify

## Switching Context Functionality ( Supporting multiple windows nav)
=> open, http://google.com, Window1 ## Open Google in Windows 1
=> open, http://yahoo.com, Window2, ## Open Yahoo in Window 2
=> switch, Window1  ## Go back to windows of google and check.
=> verifyTitle, Google,
=> switch, Window2
=> verifyTitle, Yahoo is now a part of Verizon Media,
=> switch, main
=> verifyTitle, TEST,


## Web Request
=> network_get, http://simplestore.dipankar.co.in/api/test/insert?name=dip, success
## THIS WILL NOT WORK AS , will split it=> network_post, http://simplestore.dipankar.co.in/api/test/insert, {"name":"dip", "roll":10},success#
## => network_post, http://simplestore.dipankar.co.in/api/test/insert, {"name":"dip"},success


```
Now, You are ready to run test case by : $ node-fest -f ./testcase.txt

## Testing Android
Under dev -- not yet supported

## Testing iOS
Under dev -- not yet supported

## Testing Websockets
Under dev -- not yet supported

## How to write the testcase?
The whole pupose of this freamwork to be productive by quickly writing testcase in very compact way. 
- there should be one and only one testcase file called testcase.txt. 
- Each line of this testcase file would be a test case. 
- Each test case conatins a sequence of events like open a page or click a button is an evenets, seperated by =>. e.f evnet1 => event2 => evenet3 ..
- each events can either be an "action" or an "verify" and a collection of arguments, seperated by ":". For example: open:<url> is a an event where "open" is the name of the event and <url> is the url to be open. 
  
## Example:
![Example Web test](https://i.ibb.co/9s5SWWn/Screenshot-2020-07-13-at-02-36-42.png)
![Example API test](https://i.ibb.co/QvvDfPX/Screenshot-2020-10-27-at-03-14-07.png)
