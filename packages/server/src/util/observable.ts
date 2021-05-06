export function observable<T>(callback: (key: string, value: T) => any): Record<string, T> {
    return new Proxy({}, {
        set(target: Record<string, T>, property: string, value: T) {
            target[property] = value;
            callback(property, value);
            return true;
        }
    });
}