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

import ErrorBoundary from "../../components/ErrorBoundary";
import { Flex } from "../../components/Flex";
import { debounce } from "../../utils/debounce";
import { classes, LazyComponent, lazyWebpack } from "../../utils/misc";
import { ContextMenu, FluxDispatcher, Forms, Menu, React } from "../../webpack/common";
import { filters, find } from "../../webpack/webpack";
import { SpotifyStore, Track } from "./SpotifyStore";

const cl = (className: string) => `vc-spotify-${className}`;

function msToHuman(ms: number) {
    const minutes = ms / 1000 / 60;
    const m = Math.floor(minutes);
    const s = Math.floor((minutes - m) * 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const useStateFromStores: <T>(
    stores: typeof SpotifyStore[],
    mapper: () => T,
    idk?: null,
    compare?: (old: T, newer: T) => boolean
) => T
    = lazyWebpack(filters.byCode("useStateFromStores"));

function Svg(path: string, label: string) {
    return () => (
        <svg
            className={classes(cl("button-icon"), cl(label))}
            height="24"
            width="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-label={label}
            focusable={false}
        >
            <path d={path} />
        </svg>
    );
}

// KraXen's icons :yesyes:
// from https://fonts.google.com/icons?icon.style=Rounded&icon.set=Material+Icons
// older material icon style, but still really good
const PlayButton = Svg("M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z", "play");
const PauseButton = Svg("M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z", "pause");
const SkipPrev = Svg("M7 6c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1s-1-.45-1-1V7c0-.55.45-1 1-1zm3.66 6.82l5.77 4.07c.66.47 1.58-.01 1.58-.82V7.93c0-.81-.91-1.28-1.58-.82l-5.77 4.07c-.57.4-.57 1.24 0 1.64z", "previous");
const SkipNext = Svg("M7.58 16.89l5.77-4.07c.56-.4.56-1.24 0-1.63L7.58 7.11C6.91 6.65 6 7.12 6 7.93v8.14c0 .81.91 1.28 1.58.82zM16 7v10c0 .55.45 1 1 1s1-.45 1-1V7c0-.55-.45-1-1-1s-1 .45-1 1z", "next");
const Repeat = Svg("M7 7h10v1.79c0 .45.54.67.85.35l2.79-2.79c.2-.2.2-.51 0-.71l-2.79-2.79c-.31-.31-.85-.09-.85.36V5H6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1s1-.45 1-1V7zm10 10H7v-1.79c0-.45-.54-.67-.85-.35l-2.79 2.79c-.2.2-.2.51 0 .71l2.79 2.79c.31.31.85.09.85-.36V19h11c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1v3z", "repeat");
const Shuffle = Svg("M10.59 9.17L6.12 4.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.46 4.46 1.42-1.4zm4.76-4.32l1.19 1.19L4.7 17.88c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L17.96 7.46l1.19 1.19c.31.31.85.09.85-.36V4.5c0-.28-.22-.5-.5-.5h-3.79c-.45 0-.67.54-.36.85zm-.52 8.56l-1.41 1.41 3.13 3.13-1.2 1.2c-.31.31-.09.85.36.85h3.79c.28 0 .5-.22.5-.5v-3.79c0-.45-.54-.67-.85-.35l-1.19 1.19-3.13-3.14z", "shuffle");

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            className={cl("button")}
            {...props}
        >
            {props.children}
        </button>
    );
}

function Controls() {
    const [isPlaying, shuffle, repeat] = useStateFromStores(
        [SpotifyStore],
        () => [SpotifyStore.isPlaying, SpotifyStore.shuffle, SpotifyStore.repeat]
    );

    const [nextRepeat, repeatClassName] = (() => {
        switch (repeat) {
            case "off": return ["context", "repeat-off"] as const;
            case "context": return ["track", "repeat-context"] as const;
            case "track": return ["off", "repeat-track"] as const;
            default: throw new Error(`Invalid repeat state ${repeat}`);
        }
    })();

    // the 1 is using position absolute so it does not make the button jump around
    return (
        <Flex className={cl("button-row")} style={{ gap: 0 }}>
            <Button
                className={classes(cl("button"), cl(shuffle ? "shuffle-on" : "shuffle-off"))}
                onClick={() => SpotifyStore.setShuffle(!shuffle)}
            >
                <Shuffle />
            </Button>
            <Button onClick={() => SpotifyStore.prev()}>
                <SkipPrev />
            </Button>
            <Button onClick={() => SpotifyStore.setPlaying(!isPlaying)}>
                {isPlaying ? <PauseButton /> : <PlayButton />}
            </Button>
            <Button onClick={() => SpotifyStore.next()}>
                <SkipNext />
            </Button>
            <Button
                className={classes(cl("button"), cl(repeatClassName))}
                onClick={() => SpotifyStore.setRepeat(nextRepeat)}
                style={{ position: "relative" }}
            >
                {repeat === "track" && <span className={cl("repeat-1")}>1</span>}
                <Repeat />
            </Button>
        </Flex>
    );
}

const seek = debounce((v: number) => {
    SpotifyStore.seek(v);
});

const Slider = LazyComponent(() => {
    const filter = filters.byCode("sliderContainer");
    return find(m => m.render && filter(m.render));
});

function SeekBar() {
    const { duration } = SpotifyStore.track!;

    const [storePosition, isSettingPosition, isPlaying] = useStateFromStores(
        [SpotifyStore],
        () => [SpotifyStore.mPosition, SpotifyStore.isSettingPosition, SpotifyStore.isPlaying]
    );

    const [position, setPosition] = React.useState(storePosition);

    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        if (isPlaying && !isSettingPosition) {
            setPosition(SpotifyStore.position);
            const interval = setInterval(() => {
                setPosition(p => p + 1000);
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [storePosition, isSettingPosition, isPlaying]);

    return (
        <div id={cl("progress-bar")}>
            <Forms.FormText
                variant="text-xs/medium"
                className={cl("progress-time") + " " + cl("time-left")}
                aria-label="Progress"
            >
                {msToHuman(position)}
            </Forms.FormText>
            <Slider
                minValue={0}
                maxValue={duration}
                value={position}
                onChange={(v: number) => {
                    if (isSettingPosition) return;
                    setPosition(v);
                    seek(v);
                }}
                renderValue={msToHuman}
            />
            <Forms.FormText
                variant="text-xs/medium"
                className={cl("progress-time") + " " + cl("time-right")}
                aria-label="Total Duration"
            >
                {msToHuman(duration)}
            </Forms.FormText>
        </div>
    );
}


function AlbumContextMenu({ track }: { track: Track; }) {
    const volume = useStateFromStores([SpotifyStore], () => SpotifyStore.volume);

    return (
        <Menu.ContextMenu
            navId="spotify-album-menu"
            onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
            aria-label="Spotify Album Menu"
        >
            <Menu.MenuItem
                key="open-album"
                id="open-album"
                label="Open Album"
                action={() => SpotifyStore.openExternal(`/album/${track.album.id}`)}
            />
            <Menu.MenuItem
                key="view-cover"
                id="view-cover"
                label="View Album Cover"
                // trolley
                action={() => (Vencord.Plugins.plugins.ViewIcons as any).openImage(track.album.image.url)}
            />
            <Menu.MenuControlItem
                id="spotify-volume"
                key="spotify-volume"
                label="Volume"
                control={(props, ref) => (
                    <Slider
                        {...props}
                        ref={ref}
                        value={volume}
                        minValue={0}
                        maxValue={100}
                        onChange={debounce((v: number) => SpotifyStore.setVolume(v))}
                    />
                )}
            />
        </Menu.ContextMenu>
    );
}

function Info({ track }: { track: Track; }) {
    const img = track?.album?.image;

    const [coverExpanded, setCoverExpanded] = React.useState(false);

    const i = (
        <img
            id={cl("album-image")}
            src={img?.url}
            alt="Album Image"
            onClick={() => setCoverExpanded(!coverExpanded)}
            onContextMenu={e => {
                ContextMenu.open(e, () => <AlbumContextMenu track={track} />);
            }}
        />
    );

    if (coverExpanded) return (
        <div id={cl("album-expanded-wrapper")}>
            {i}
        </div>
    );

    return (
        <div id={cl("info-wrapper")}>
            {i}
            <div id={cl("titles")}>
                <Forms.FormText
                    variant="text-sm/semibold"
                    id={cl("song-title")}
                    className={cl("ellipoverflow")}
                    title={track.name}
                    onClick={() => SpotifyStore.openExternal(`/track/${track.id}`)}
                >
                    {track.name}
                </Forms.FormText>
                <Forms.FormText variant="text-sm/normal" className={cl("ellipoverflow")}>
                    by&nbsp;
                    {track.artists.map((a, i) => (
                        <React.Fragment key={a.id}>
                            <a
                                className={cl("artist")}
                                href={`https://open.spotify.com/artist/${a.id}`}
                                target="_blank"
                                style={{ fontSize: "inherit" }}
                                title={a.name}
                            >
                                {a.name}
                            </a>
                            {i !== track.artists.length - 1 && <span className={cl("comma")}>{", "}</span>}
                        </React.Fragment>
                    ))}
                </Forms.FormText>
                <Forms.FormText variant="text-sm/normal" className={cl("ellipoverflow")}>
                    on&nbsp;
                    <a id={cl("album-title")}
                        href={`https://open.spotify.com/album/${track.album.id}`}
                        target="_blank"
                        className={cl("album")}
                        style={{ fontSize: "inherit" }}
                        title={track.album.name}
                    >
                        {track.album.name}
                    </a>
                </Forms.FormText>
            </div>
        </div>
    );
}

export function Player() {
    const track = useStateFromStores(
        [SpotifyStore],
        () => SpotifyStore.track,
        null,
        (prev, next) => prev?.id === next?.id
    );

    const device = useStateFromStores(
        [SpotifyStore],
        () => SpotifyStore.device,
        null,
        (prev, next) => prev?.id === next?.id
    );

    const isPlaying = useStateFromStores([SpotifyStore], () => SpotifyStore.isPlaying);
    const [shouldHide, setShouldHide] = React.useState(false);

    // Hide player after 5 minutes of inactivity
    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
        setShouldHide(false);
        if (!isPlaying) {
            const timeout = setTimeout(() => setShouldHide(true), 1000 * 60 * 5);
            return () => clearTimeout(timeout);
        }
    }, [isPlaying]);

    if (!track || !device?.is_active || shouldHide)
        return null;

    return (
        <ErrorBoundary fallback={() => (
            <>
                <Forms.FormText>Failed to render Spotify Modal :(</Forms.FormText>
                <Forms.FormText>Check the console for errors</Forms.FormText>
            </>
        )}>
            <div id={cl("player")}>
                <Info track={track} />
                <SeekBar />
                <Controls />
            </div>
        </ErrorBoundary>
    );
}
