import React from "react";
import { SelectorContext, StateSetter } from "../contexts/selector-context";
import List from "@material-ui/core/List";
import ListSubheader from "@material-ui/core/ListSubheader";
import Selector from "./Selector";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import PlusIcon from "@material-ui/icons/Add";
import Tooltip from "@material-ui/core/Tooltip";

export interface SelectorProps<T extends string> {
    header: React.ReactNode;
    children: (value: T) => React.ReactNode;
    value: T | null | undefined;
    values: T[];
    setValue: (value: T | null) => void;
    onAdd?: () => void;
    canAdd?: boolean;
}

export default function SelectorGroup<T extends string>({ header, children, value, values, setValue, onAdd, canAdd = false }: SelectorProps<T>) {
    return (
        <SelectorContext.Provider value={{ value, values, setValue: setValue as unknown as StateSetter<string | null> }}>
            <List subheader={
                <Grid container alignItems="center">
                    <Grid item xs>
                        <ListSubheader component="div">
                            {header}
                        </ListSubheader>
                    </Grid>
                    {
                        canAdd ? (
                            <Grid item>
                                <Tooltip title={
                                    <>Add {header}</>
                                }>
                                    <IconButton onClick={onAdd}>
                                        <PlusIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        ) : null
                    }
                </Grid>
            }>
                {values.map(value => (
                    <Selector value={value} key={value}>
                        {children(value as T)}
                    </Selector>
                ))}
            </List>
        </SelectorContext.Provider>
    )
}