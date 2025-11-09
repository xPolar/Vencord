/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./style.css";

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu } from "@webpack/common";

import { openSetTimezoneModal, TimezoneIndicator } from "./components";
import { loadTimezonesFromDataStore, saveTimezonesToDataStore, timezoneCache } from "./utils";

interface UserContextProps {
    user: {
        id: string;
    };
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: UserContextProps) => {
    if (!user) return;

    const currentTimezone = timezoneCache.get(user.id);

    children.push(
        <Menu.MenuItem
            id="vc-set-timezone"
            label="Set Timezone"
            action={() => openSetTimezoneModal(user.id)}
        >
            {currentTimezone && (
                <Menu.MenuItem
                    id="vc-clear-timezone"
                    label="Clear Timezone"
                    action={() => {
                        timezoneCache.delete(user.id);
                        saveTimezonesToDataStore();
                    }}
                />
            )}
        </Menu.MenuItem>
    );
};

export default definePlugin({
    name: "UserTimezone",
    description: "Set and display users' local timezones on their profiles",
    authors: [Devs.xPolar],

    patches: [
        {
            find: "#{intl::USER_PROFILE_LOAD_ERROR}",
            replacement: {
                match: /(\.fetchError.+?\?)null/,
                replace: (_, rest) => `${rest}$self.TimezoneIndicator({userId:arguments[0]?.userId})`
            }
        }
    ],

    contextMenus: {
        "user-context": UserContextMenuPatch
    },

    async start() {
        await loadTimezonesFromDataStore();
    },

    TimezoneIndicator: ErrorBoundary.wrap((props: { userId: string; }) =>
        <TimezoneIndicator {...props} />, { noop: true })
});
