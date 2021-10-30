import React, { useState, useCallback, useEffect } from "react";
import Modal, { ModalProps } from "@material-ui/core/Modal";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { useStyles } from "../../theme";
import { createContext } from "react";
import once from "lodash.once";


export interface SPModalProps<T extends string | number | symbol> extends Omit<ModalProps, "children"> {
    keys: T[];
    onFinished: (values: Record<T, string>) => any;
    autoClear?: boolean;
    disabled?: boolean;
    header?: React.ReactNode;
    children?: (key: T) => React.ReactNode;
};

const _FormContext = once(<T extends string | number | symbol,>() => createContext({
    values: {} as Record<T, string>,
    setValue: (id: T, value: string): void => undefined
}));

const getNodeText = (node: React.ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") return node.toString();
    else if (node instanceof Array) return node.map(getNodeText).join('');
    else if (React.isValidElement(node)) return getNodeText(node.props.children);
    else return "";
};

export default function SPModal<T extends string | number | symbol>({ keys, disabled = false, onFinished, header, children, autoClear, ...props }: SPModalProps<T>) {
    const classes = useStyles();
    type Dict = Partial<Record<T, string>>
    const [values, setValues] = useState<Dict>({});

    const setValue = useCallback((key: T, value: Dict[T]) => {
        setValues(Object.assign({}, values, { [key]: value }));
    }, [values]);

    useEffect(() => {
        if (!autoClear) return;
        setValues({});
    }, [props.open, autoClear]);

    const [busy, setBusy] = useState(false);

    const _disabled = disabled || busy;
    
    return (
        <Modal className={classes.modal} {...props}>
            <Container maxWidth="sm">
                <Paper className={classes.modalPaper}>
                    {header ? (
                        <>
                            <br />
                            {header}
                        </>
                    ) : null}

                    <br />

                    {keys.map((key, index) => (
                        <>
                            <TextField key={(index+1) * 20} disabled={_disabled} onChange={e => setValue(key, e.target.value)} placeholder={children ? getNodeText(children(key)) : undefined} className={classes.textField} />
                    
                            {index < (keys.length - 1) ? (
                                <>
                                    <br key={(index+1) * 200} />
                                    <br key={(index+1) * 2000} />
                                </>
                            ) : null}
                        </>
                    ))}

                    <br />
                    <br />
                    <br />

                    <Button variant="contained" color="primary" disabled={_disabled} onClick={async () => {
                        if (busy) return;
                        
                        try {
                            setBusy(true);
                            await onFinished(values as Record<T, string>);
                        } finally {
                            setBusy(false);
                        }

                        props.onClose?.({}, "escapeKeyDown");
                    }}>
                        Add
                    </Button>
                </Paper>
            </Container>
        </Modal>
    )
}