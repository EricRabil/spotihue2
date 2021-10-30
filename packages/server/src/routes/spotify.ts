import { IsString, MaxLength } from "class-validator";
import { APIResponse, assertValid, ErrorResponse, Validatable } from "er-expresskit";
import { Router } from "express";
import { SpotifyAccount } from "../entities/SpotifyAccount";
import { assertUUID } from "../util/validation";

export const SpotifyRoutes = Router();

class AccountCreationRequest extends Validatable<{ cookies: string; label: string; }> {
    @IsString()
    cookies: string;

    @IsString()
    @MaxLength(256)
    label: string;
}

SpotifyRoutes.post("/accounts", async (req, res) => {
    const { cookies, label } = assertValid(AccountCreationRequest, req.body);

    const { json: account } = await SpotifyAccount.create({ cookies, label }).save();
    await SpotifyAccount.emitUpdated();

    APIResponse.json({ account }).send(res);
});

SpotifyRoutes.get("/accounts", async (req, res) => {
    const accounts = await SpotifyAccount.find();

    APIResponse.json({ accounts: accounts.map(account => account.json) }).send(res);
});

SpotifyRoutes.get("/accounts/:accountID", async (req, res) => {
    const account = await SpotifyAccount.findOne({ uuid: assertUUID(req.params.accountID) });

    if (!account) throw ErrorResponse.status(404).message("Account not found");

    APIResponse.json({ account: account.json }).send(res);
});

SpotifyRoutes.delete("/accounts/:accountID", async (req, res) => {
    const account = await SpotifyAccount.findOne({ uuid: assertUUID(req.params.accountID) });

    if (!account) throw ErrorResponse.status(404).message("Account not found");

    await account.remove();
    await SpotifyAccount.emitUpdated();

    APIResponse.json({ message: "Account deleted" }).send(res);
});