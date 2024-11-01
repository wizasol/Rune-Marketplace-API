// import { getUserState } from "./user_state";
import crypto from 'crypto';

const validatorAddr = (address: string) => {
    return /^0x[0-9a-fA-F]{40}$/.test(address)
}

const waitFor = (delay: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, delay));
};

const removeEleInAry = (element: string, ary: string[]) => {
    let returnAry: string[] = []

    ary.forEach(ele => { if (ele != element) returnAry.push(ele) })

    return returnAry
}

const abbrAddr = (addr: string) => `${addr.slice(0, 4)} ... ${addr.slice(addr.length - 5, addr.length - 1)}`

const add5s = (): Date => {
    const newDate = new Date(); // Create a copy of the original date
    newDate.setSeconds(newDate.getSeconds() + 5); // Add one month
    return newDate;
}

const add10s = (): Date => {
    const newDate = new Date(); // Create a copy of the original date
    newDate.setSeconds(newDate.getSeconds() + 10); // Add one month
    return newDate;
}

const addOneMonth = (): Date => {
    const newDate = new Date(); // Create a copy of the original date
    newDate.setMonth(newDate.getMonth() + 1); // Add one month
    return newDate;
}

const addOneYear = (): Date => {
    const newDate = new Date(); // Create a copy of the original date
    newDate.setFullYear(newDate.getFullYear() + 1); // Add one year
    return newDate;
}

const encrypt = (text : string, key : string) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
};


const decrypt = (encrypted : string, key : string) => {
    const keys = Buffer.from(key , "hex")
    const decipher = crypto.createDecipheriv('aes-256-cbc', keys, Buffer.alloc(16, 0));
    let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

export {
    validatorAddr,
    waitFor,
    removeEleInAry,
    abbrAddr,
    addOneMonth,
    addOneYear,
    encrypt,
    decrypt,
    add5s,
    add10s
}