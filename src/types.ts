export type TestCase = {
    line: number, // file line number
    command: string, // get or post
    arguments: string[]
};
export type IObject = { [key: string]: any };