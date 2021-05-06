import { ErrorResponse } from "er-expresskit";
import validator from "validator";

export const assertUUID = (uuid: string) => {
    if (validator.isUUID(uuid)) return uuid;
    throw ErrorResponse.status(400).message("Expected a UUID").error;
}