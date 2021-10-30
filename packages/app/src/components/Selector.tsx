import { SelectorContext } from "../contexts/selector-context";
import React, { ReactNode } from "react";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Radio from "@material-ui/core/Radio";
import ListItemText from "@material-ui/core/ListItemText";

export default function Selector({ value, children }: { value: string, children: ReactNode }) {
    return (
        <SelectorContext.Consumer>
            {({ value: selectedValue, setValue }) => (
                <ListItem dense button onClick={() => {
                    if (selectedValue === value) setValue(null);
                    else setValue(value);
                }}>
                    <ListItemIcon>
                        <Radio
                            edge="start"
                            checked={selectedValue === value}
                            tabIndex={-1}
                            disableRipple
                        />
                    </ListItemIcon>
                    <ListItemText primary={children} />
                </ListItem>
            )}
        </SelectorContext.Consumer>
    )
}