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

First Instruction| Example               |       Explanation
------------- | -------------------------|-------------------------
Comments | # Sample comments | Any line starts with # will be comments
open page | open:http://google.com | open google.com
Type in a input box |typeWithEnter:name_p:DIPANKAR  | You are trying text for a input like `<input name="p"></input>` and press enter |
verify text is shown |verifyBodyText: DIAPANKAR| Verify that you have the given text in a body

Full Example: open:http://google.com => typeWithEnter:name_p:DIPANKAR => verifyBodyText: DIAPANKAR.

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
