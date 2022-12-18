import * as vscode from "vscode";
import getInstalled from "./getInstalled";
import { createChildLogger } from "../../services/logging.service";
import { ADDONS_DIRECTORY } from "../config";
import { getEnabledAddons, getEnabledLibraries } from "../util/addon";
import { setSetting } from "../util/settings";

const localLogger = createChildLogger("Uninstall Addon");

type Message = {
    name: string;
};

export default async (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    data: Message
) => {
    const extensionStorageURI = context.globalStorageUri;
    const uri = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY,
        data.name
    );

    // If it is currently enabled, disable it
    try {
        const enabledLibraries = getEnabledLibraries(true);
        const enabledAddons = getEnabledAddons(enabledLibraries);
        /** Index of target addon in `enabledLibraries` */
        const index = enabledAddons[data.name];
        if (index !== undefined) enabledLibraries.splice(index, 1);
        // Update library setting
        setSetting("library", "Lua.workspace", enabledLibraries);
    } catch (e) {
        localLogger.verbose(e);
    }

    return vscode.workspace.fs
        .delete(uri, { recursive: true, useTrash: true })
        .then(
            () => {
                localLogger.info(`Successfully uninstalled ${data.name}`);
                getInstalled(context, webview);
            },
            (err) => {
                localLogger.error(
                    `Failed to uninstall "${data.name} addon (${err})"`
                );
            }
        );
};
