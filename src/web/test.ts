import { SWT } from "./api";
async function test() {
    let swt = new SWT()
    await swt.initChome();
    await swt.open("https://facebook.com")
    await swt.wait(1000)
    await swt.open("https://google.com")
    await swt.hasText("Facebook helps you connect and share with the people in your life.")
    await swt.hasText("Facebook helps you connect and share with the people in your life.")
}
test();

