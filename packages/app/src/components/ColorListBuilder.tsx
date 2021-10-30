import Accordion from '@material-ui/core/Accordion';
import AccordionActions from '@material-ui/core/AccordionActions';
import Button from '@material-ui/core/Button';
import { Color, EffectColor } from 'phea.js';
import React from "react";
import ColorListItem from "./ColorListItem";

function replace<T>(array: T[], index: number, element: T): T[] {
    array = array.slice();
    array[index] = element;
    return array;
}

function swap<T>(array: T[], index1: number, index2: number): T[] {
    const newArray = array.slice();
    newArray[index1] = array[index2];
    newArray[index2] = array[index1];
    return newArray;;
}

function splice<T>(array: T[], index: number, deleteCount?: number): T[] {
    array = array.slice();
    array.splice(index, deleteCount);
    return array;
}

export default function ColorListBuilder({ colors, setColors }: { colors: EffectColor[], setColors: (colors: EffectColor[]) => void }) {
    return (
        <>
            <Accordion>
                <AccordionActions>
                    <Button size="small" color="primary" onClick={() => {
                        const clone = colors.slice();
                        clone.push(Color.WHITE);
                        setColors(clone);
                    }}>
                        Add Color
                    </Button>
                </AccordionActions>
            </Accordion>
            {colors.map((color, index) => (
                <ColorListItem
                    key={index}
                    color={color}
                    setColor={newColor => {
                        setColors(replace(colors, index, newColor));
                    }}
                    remove={() => {
                        setColors(splice(colors, index, 1));
                    }}
                    up={index === 0 ? null : () => {
                        setColors(swap(colors, index, index - 1));
                    }}
                    down={index === colors.length - 1 ? null : () => {
                        setColors(swap(colors, index, index + 1));
                    }}
                >
                    Color {index + 1}
                </ColorListItem>
            ))}
        </>
    )
}