export function omitObjectKeys<Obj extends object = object>(obj: Obj, keys: Array<keyof Obj>|keyof Obj): object {

    const final = { ...obj } as Obj;

    if(Array.isArray(keys)) 
        for(const key of keys) {
            if(Object.hasOwn(final, key)) 
                delete final[key];
        }
    else
        Object.hasOwn(final, keys) &&
            delete final[keys];

    return final;
}

/** a typed version of `Objecy.hasOwn` function :D
 * typescript should definetly adopt this!! */
export function owns<
    T extends unknown = unknown,
    O extends object = object,
    K extends string|keyof O = string|keyof O
>(obj: O, prop: K): obj is O&{ [k: string]: T } {
    return Object.hasOwn(obj, prop);
}
