/// <reference types="react-scripts" />

declare module "fast-json" {
    export default class FastJson {
        on<T = any>(path: string, cb: (value: T) => any): void;
        write(data: string | Buffer);
    }
}