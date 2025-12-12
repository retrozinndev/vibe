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
