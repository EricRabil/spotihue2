import React, { createContext } from "react";

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export const SelectorContext = createContext({
    value: null,
    values: [],
    setValue: () => undefined
} as {
    value: string | null | undefined;
    values: string[];
    setValue: StateSetter<string | null>;
});
