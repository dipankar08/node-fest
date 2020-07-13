# Motivation.
Welcome to the world's simplest WWW automation framework.  With this, you can write a high-quality e2e automation test in a very simple compact way without any code. 

# Features:
a. Write automation without any code.
b) Simple to write the test case
c) The testcase is very compact - Everyline of the textcase file should be one complete test case.
d) it takes 1/10000000 efforts to write a testcase than the feature dev.

# Getting started
a) sudo npm install simplewebtest -g
b) create a testcase file : vim testcase.txt.
c) write a test case line: open:http://google.com => typeWithEnter:name_p:DIPANKAR => verifyBodyText: DIAPANKAR.
d) Run test case by : $ simplewebtest -f ./testcase.txt

# How to write the testcase?
The whole pupose of this freamwork to be productive by quickly writing testcase in very compact way. 
a) there should be one and only one testcase file called testcase.txt. 
b) Each line of this testcase file would be a test case. 
b) Each test case conatins a sequence of events like open a page or click a button is an evenets, seperated by =>. e.f evnet1 => event2 => evenet3 ..
d) each events can either be an "action" or an "verify" and a collection of arguments, seperated by ":". For example: open:<url> is a an event where "open" is the name of the event and <url> is the url to be open. 
