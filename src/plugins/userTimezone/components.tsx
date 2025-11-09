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

import { classNameFactory } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { Button, Forms, React, SearchableSelect, Tooltip, useMemo, useState } from "@webpack/common";

import { TIMEZONES } from "./timezones";
import { saveTimezonesToDataStore, timezoneCache } from "./utils";

const cl = classNameFactory("vc-user-timezone-");

function ClockIcon(props: React.ComponentPropsWithoutRef<"svg">) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            {...props}
        >
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm1 2v4.586l2.707 2.707-1.414 1.414L7 9.414V4h2z" />
        </svg>
    );
}

export function TimezoneIndicator({ userId }: { userId: string; }) {
    const timezone = timezoneCache.get(userId);
    const [currentTime, setCurrentTime] = useState<string | null>(null);

    const calculateTime = useMemo(() => {
        if (!timezone) return null;

        try {
            return new Intl.DateTimeFormat("en-US", {
                timeZone: timezone,
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }).format(new Date());
        } catch {
            return null;
        }
    }, [timezone]);

    React.useEffect(() => {
        if (!timezone) return;

        const updateTime = () => {
            try {
                const time = new Intl.DateTimeFormat("en-US", {
                    timeZone: timezone,
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                }).format(new Date());
                setCurrentTime(time);
            } catch {
                setCurrentTime(null);
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, [timezone]);

    if (!timezone || !currentTime) return null;

    return (
        <Tooltip text={timezone}>
            {props => (
                <div className={cl("indicator")} {...props}>
                    <ClockIcon className={cl("icon")} />
                    <span className={cl("time")}>{currentTime} local time</span>
                </div>
            )}
        </Tooltip>
    );
}

export function SetTimezoneModal({ userId, rootProps }: { userId: string; rootProps: ModalProps; }) {
    const [selectedTz, setSelectedTz] = useState(timezoneCache.get(userId) || "");

    const timezoneOptions = useMemo(
        () => TIMEZONES.map(tz => ({
            label: tz.label,
            value: tz.value
        })),
        []
    );

    const onSave = () => {
        if (selectedTz) {
            timezoneCache.set(userId, selectedTz);
            saveTimezonesToDataStore();
        }
        rootProps.onClose();
    };

    const onClear = () => {
        timezoneCache.delete(userId);
        saveTimezonesToDataStore();
        rootProps.onClose();
    };

    return (
        <ModalRoot {...rootProps}>
            <ModalHeader>
                <Forms.FormTitle tag="h2">Set Timezone</Forms.FormTitle>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent>
                <Forms.FormTitle tag="h5">Select Timezone</Forms.FormTitle>
                <SearchableSelect
                    options={timezoneOptions}
                    value={timezoneOptions.find(o => o.value === selectedTz)}
                    placeholder="Select a timezone"
                    maxVisibleItems={5}
                    closeOnSelect={true}
                    onChange={v => setSelectedTz(v)}
                />
            </ModalContent>

            <ModalFooter>
                <Button color={Button.Colors.BRAND} onClick={onSave}>
                    Save
                </Button>
                {timezoneCache.has(userId) && (
                    <Button color={Button.Colors.PRIMARY} onClick={onClear}>
                        Clear Timezone
                    </Button>
                )}
                <Button color={Button.Colors.PRIMARY} onClick={rootProps.onClose}>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export function openSetTimezoneModal(userId: string) {
    openModal(props => <SetTimezoneModal userId={userId} rootProps={props} />);
}
