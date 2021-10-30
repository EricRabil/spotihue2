import React from "react";
import { ActivityType } from "@spotihue/shared";
import { ActivityContext } from "../../contexts/activity-context";
import SelectorGroup from "../SelectorGroup";

const ALL_ACTIVITY_TYPES = Object.values(ActivityType);

export default function ActivityPicker() {
    return (
        <ActivityContext.Consumer>
            {({ type, setType }) => (
                <SelectorGroup header="Activity Type" value={type} values={ALL_ACTIVITY_TYPES} setValue={setType}>
                    {activityType => activityType}
                </SelectorGroup>
            )}
        </ActivityContext.Consumer>
    )
}