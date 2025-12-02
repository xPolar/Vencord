/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, Settings } from "@api/Settings";
import { getUserSettingLazy } from "@api/UserSettings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Devs } from "@utils/constants";
import { Margins } from "@utils/margins";
import definePlugin, { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";
import { Button, Forms, React, showToast, TextInput, Toasts, Tooltip, useCallback, useEffect, useMemo, useState } from "@webpack/common";

const enum ActivitiesTypes {
    Game,
    Embedded
}

interface IgnoredActivity {
    id: string;
    name: string;
    type: ActivitiesTypes;
}

const enum FilterMode {
    Whitelist,
    Blacklist
}

const RunningGameStore = findStoreLazy("RunningGameStore");

const ShowCurrentGame = getUserSettingLazy("status", "showCurrentGame")!;

let idsSet = new Set<string>();
let ignoredActivitiesSet = new Set<string>();

function rebuildCaches() {
    idsSet = new Set(
        settings.store.idsList
            .split(",")
            .map(id => id.trim())
            .filter(Boolean)
    );
    ignoredActivitiesSet = new Set(
        settings.store.ignoredActivities.map(act => act.id)
    );
}

const ICON_PATH_ON = "M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z";
const ICON_PATH_OFF = "m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z";

const BUTTON_STYLE = { all: "unset", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" } as const;

function ToggleIcon({ activity, tooltipText, path, fill, onClick }: {
    activity: IgnoredActivity;
    tooltipText: string;
    path: string;
    fill: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <Tooltip text={tooltipText}>
            {tooltipProps => (
                <button
                    {...tooltipProps}
                    onClick={onClick}
                    style={BUTTON_STYLE}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 -960 960 960"
                    >
                        <path fill={fill} d={path} />
                    </svg>
                </button>
            )}
        </Tooltip>
    );
}

function ToggleActivityComponent({ activity, isPlaying = false }: { activity: IgnoredActivity; isPlaying?: boolean; }) {
    settings.use(["ignoredActivities"]);

    const onClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const index = settings.store.ignoredActivities.findIndex(act => act.id === activity.id);
        if (index === -1) {
            settings.store.ignoredActivities.push(activity);
            ignoredActivitiesSet.add(activity.id);
        } else {
            settings.store.ignoredActivities.splice(index, 1);
            ignoredActivitiesSet.delete(activity.id);
        }
    }, [activity]);

    const isIgnored = ignoredActivitiesSet.has(activity.id);

    return (
        <ToggleIcon
            activity={activity}
            tooltipText={isIgnored ? "Enable activity" : "Disable activity"}
            path={isIgnored ? ICON_PATH_OFF : ICON_PATH_ON}
            fill={isIgnored ? "var(--status-danger)" : (isPlaying ? "var(--green-300)" : "var(--interactive-normal)")}
            onClick={onClick}
        />
    );
}



function recalculateActivities() {
    rebuildCaches();
    ShowCurrentGame.updateSetting(old => old);
}

function ImportCustomRPCComponent() {
    return (
        <Flex flexDirection="column">
            <Forms.FormText>Import the application id of the CustomRPC plugin to the filter list</Forms.FormText>
            <div>
                <Button
                    onClick={() => {
                        const id = Settings.plugins.CustomRPC?.appID as string | undefined;
                        if (!id) {
                            return showToast("CustomRPC application ID is not set.", Toasts.Type.FAILURE);
                        }

                        const isAlreadyAdded = idsListPushID?.(id);
                        if (isAlreadyAdded) {
                            showToast("CustomRPC application ID is already added.", Toasts.Type.FAILURE);
                        } else {
                            showToast("CustomRPC application ID added successfully.", Toasts.Type.SUCCESS);
                        }
                    }}
                >
                    Import CustomRPC ID
                </Button>
            </div>
        </Flex>
    );
}

let idsListPushID: ((id: string) => boolean) | null = null;

function IdsListComponent({ setValue }: { setValue: (value: string) => void; }) {
    const [idsList, setIdsList] = useState<string>(settings.store.idsList ?? "");

    const handleChange = useCallback((newValue: string) => {
        setIdsList(newValue);
        setValue(newValue);
    }, [setValue]);

    useEffect(() => {
        idsListPushID = (id: string) => {
            if (idsSet.has(id)) return true;

            idsSet.add(id);
            const ids = Array.from(idsSet).join(", ");
            setIdsList(ids);
            setValue(ids);
            return false;
        };

        return () => {
            idsListPushID = null;
        };
    }, [setValue]);

    return (
        <section>
            <Forms.FormTitle tag="h3">Filter List</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>Comma separated list of activity IDs to filter (Useful for filtering specific RPC activities and CustomRPC</Forms.FormText>
            <TextInput
                type="text"
                value={idsList}
                onChange={handleChange}
                placeholder="235834946571337729, 343383572805058560"
            />
        </section>
    );
}

const settings = definePluginSettings({
    importCustomRPC: {
        type: OptionType.COMPONENT,
        component: ImportCustomRPCComponent
    },
    listMode: {
        type: OptionType.SELECT,
        description: "Change the mode of the filter list",
        options: [
            {
                label: "Whitelist",
                value: FilterMode.Whitelist,
                default: true
            },
            {
                label: "Blacklist",
                value: FilterMode.Blacklist,
            }
        ],
        onChange: recalculateActivities
    },
    idsList: {
        type: OptionType.COMPONENT,
        default: "",
        onChange(newValue: string) {
            idsSet = new Set(newValue.split(",").map(id => id.trim()).filter(Boolean));
            settings.store.idsList = Array.from(idsSet).join(", ");
            recalculateActivities();
        },
        component: props => <IdsListComponent setValue={props.setValue} />
    },
    ignorePlaying: {
        type: OptionType.BOOLEAN,
        description: "Ignore all playing activities (These are usually game and RPC activities)",
        default: false,
        onChange: recalculateActivities
    },
    ignoreStreaming: {
        type: OptionType.BOOLEAN,
        description: "Ignore all streaming activities",
        default: false,
        onChange: recalculateActivities
    },
    ignoreListening: {
        type: OptionType.BOOLEAN,
        description: "Ignore all listening activities (These are usually spotify activities)",
        default: false,
        onChange: recalculateActivities
    },
    ignoreWatching: {
        type: OptionType.BOOLEAN,
        description: "Ignore all watching activities",
        default: false,
        onChange: recalculateActivities
    },
    ignoreCompeting: {
        type: OptionType.BOOLEAN,
        description: "Ignore all competing activities (These are normally special game activities)",
        default: false,
        onChange: recalculateActivities
    },
    ignoredActivities: {
        type: OptionType.CUSTOM,
        default: [] as IgnoredActivity[],
        onChange() {
            ignoredActivitiesSet = new Set(settings.store.ignoredActivities.map(act => act.id));
            recalculateActivities();
        }
    }
});

function isActivityTypeIgnored(type: number, id?: string) {
    if (id && idsSet.has(id)) {
        return settings.store.listMode === FilterMode.Blacklist;
    }

    switch (type) {
        case 0: return settings.store.ignorePlaying;
        case 1: return settings.store.ignoreStreaming;
        case 2: return settings.store.ignoreListening;
        case 3: return settings.store.ignoreWatching;
        case 5: return settings.store.ignoreCompeting;
        default: return false;
    }
}

export default definePlugin({
    name: "IgnoreActivities",
    authors: [Devs.Nuckyz, Devs.Kylie],
    description: "Ignore activities from showing up on your status ONLY. You can configure which ones are specifically ignored from the Registered Games and Activities tabs, or use the general settings below",
    dependencies: ["UserSettingsAPI"],

    settings,

    patches: [
        {
            find: '"LocalActivityStore"',
            replacement: [
                {
                    match: /\.LISTENING.+?(?=!?\i\(\)\(\i,\i\))(?<=(\i)\.push.+?)/,
                    replace: (m, activities) => `${m}${activities}=${activities}.filter($self.isActivityNotIgnored);`
                }
            ]
        },
        {
            find: '"ActivityTrackingStore"',
            replacement: {
                match: /getVisibleRunningGames\(\).+?;(?=for)(?<=(\i)=\i\.\i\.getVisibleRunningGames.+?)/,
                replace: (m, runningGames) => `${m}${runningGames}=${runningGames}.filter(({id,name})=>$self.isActivityNotIgnored({type:0,application_id:id,name}));`
            }
        },

        // FIXME(Bundler minifier change related): Remove the non used compability once enough time has passed
        {
            find: "#{intl::SETTINGS_GAMES_TOGGLE_OVERLAY}",
            replacement: {
                // let { ... nowPlaying: a = !1 ...
                // let { overlay: b ... } = Props
                match: /#{intl::SETTINGS_GAMES_TOGGLE_OVERLAY}.+?}\(\),(?<=nowPlaying:(\i)=!1,.+?overlay:\i,[^}]+?\}=(\i).+?)/,
                replace: (m, nowPlaying, props) => `${m}$self.renderToggleGameActivityButton(${props},${nowPlaying}),`,
                noWarn: true,
            }
        },
        {
            find: "#{intl::SETTINGS_GAMES_TOGGLE_OVERLAY}",
            replacement: {
                // let { ... nowPlaying: a = !1 ...
                // let { overlay: b ... } = Props ...
                // ToggleOverLayButton(), nowPlaying && ... RemoveGameButton()
                match: /\.gameNameLastPlayed.+?,\i\(\),(?<=nowPlaying:(\i)=!1,.+?overlay:\i,[^}]+?\}=(\i).+?)(?=\1&&)/,
                replace: (m, nowPlaying, props) => `${m}$self.renderToggleGameActivityButton(${props},${nowPlaying}),`,
            }
        },

        // Activities from the apps launcher in the bottom right of the chat bar
        {
            find: ".promotedLabelWrapperNonBanner,children",
            replacement: {
                match: /\.appDetailsHeaderContainer.+?children:\i.*?}\),(?<=application:(\i).+?)/,
                replace: (m, props) => `${m}$self.renderToggleActivityButton(${props}),`
            }
        }
    ],

    async start() {
        rebuildCaches();

        if (settings.store.ignoredActivities.length !== 0) {
            const gamesSeen = RunningGameStore.getGamesSeen() as { id?: string; exePath: string; }[];
            const gamesSeenSet = new Set(gamesSeen.flatMap(game => [game.id, game.exePath].filter(Boolean)));

            settings.store.ignoredActivities = settings.store.ignoredActivities.filter(
                activity => activity.type !== ActivitiesTypes.Game || gamesSeenSet.has(activity.id)
            );
            ignoredActivitiesSet = new Set(settings.store.ignoredActivities.map(act => act.id));
        }
    },

    isActivityNotIgnored(props: { type: number; application_id?: string; name?: string; }) {
        if (isActivityTypeIgnored(props.type, props.application_id)) return false;

        if (props.application_id != null) {
            const isIgnored = ignoredActivitiesSet.has(props.application_id);
            const isWhitelisted = settings.store.listMode === FilterMode.Whitelist && idsSet.has(props.application_id);
            return !isIgnored || isWhitelisted;
        }

        if (props.name) {
            const exePath = RunningGameStore.getRunningGames().find(game => game.name === props.name)?.exePath;
            if (exePath) {
                return !ignoredActivitiesSet.has(exePath);
            }
        }

        return true;
    },

    renderToggleGameActivityButton(props: { id?: string; name: string, exePath: string; }, nowPlaying: boolean) {
        const activity = useMemo(
            () => ({ id: props.id ?? props.exePath, name: props.name, type: ActivitiesTypes.Game }),
            [props.id, props.exePath, props.name]
        );

        return (
            <ErrorBoundary noop>
                <div style={{ marginLeft: 12, zIndex: 0 }}>
                    <ToggleActivityComponent activity={activity} isPlaying={nowPlaying} />
                </div>
            </ErrorBoundary>
        );
    },

    renderToggleActivityButton(props: { id: string; name: string; }) {
        const activity = useMemo(
            () => ({ id: props.id, name: props.name, type: ActivitiesTypes.Embedded }),
            [props.id, props.name]
        );

        return (
            <ErrorBoundary noop>
                <ToggleActivityComponent activity={activity} />
            </ErrorBoundary>
        );
    }
});
