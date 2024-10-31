export const log = (...args: any[]): void => {
    let out = '';
    for (const arg of args) {
        out += JSON.stringify(arg);
    }


    const errorLocation: string = new Error().stack.split("\n")[2].split(" ").filter(v => v !== '').slice(1, -1).join(' ');
    console.log(`[${getTimestamp()} @ ${errorLocation}] ${out}`);
}

export const getTimestamp = (): string => {
    return new Date().toLocaleTimeString()
}



