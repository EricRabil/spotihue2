export function env_namespace(namespace: string): Record<string, any> {
    return Object.fromEntries(Object.entries(process.env).filter(([ key ]) => key.startsWith(`${namespace}_`)).map(([ key, value ]: [ string, any ]) => {
        switch (value) {
            case "true":
                value = true;
                break;
            case "false":
                value = false;
                break;
            default:
                // eslint-disable-next-line no-case-declarations
                const numValue = +value;

                if (!isNaN(numValue) && numValue.toString() === value) value = numValue;
                break;
        }

        return [ key.slice(`${namespace}_`.length).toLowerCase(), value! ];
    }));
}