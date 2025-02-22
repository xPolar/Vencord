/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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


import { Devs } from "../../utils/constants";
import { LazyComponent } from "../../utils/misc";
import definePlugin from "../../utils/types";

export default definePlugin({
    name: "StartupTimings",
    description: "Adds Startup Timings to the Settings menu",
    authors: [Devs.Megu],
    patches: [{
        find: "PAYMENT_FLOW_MODAL_TEST_PAGE,",
        replacement: {
            match: /({section:[\w.]+?\.PAYMENT_FLOW_MODAL_TEST_PAGE,)/,
            replace: '{section:"StartupTimings",label:"Startup Timings",element:Vencord.Plugins.plugins.StartupTimings.StartupTimingPage},$1'
        }
    }],
    StartupTimingPage: LazyComponent(() => require("./StartupTimingPage").default)
});
