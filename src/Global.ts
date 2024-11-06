/**
 *  Logger that includes a timestamp and code location.
 *  @param args Things to print.
 */
export const log = (...args: any[]): void => {
    let out = '';
    for (const arg of args) {
        out += typeof arg === 'string' ? arg : JSON.stringify(arg);
    }

    const errorLocation: string = new Error().stack.split("\n")[2].split(" ").filter(v => v !== '').slice(1, -1).join(' ');
    console.log(`[${new Date().toLocaleTimeString()} @ ${errorLocation}] ${out}`);
}


