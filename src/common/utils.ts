    // helper
export function sleep(s:number) {
        return new Promise(resolve => setTimeout(resolve, s*1000));
}
export function sleepMS(s:number) {
    return new Promise(resolve => setTimeout(resolve, s));
}
