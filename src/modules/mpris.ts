import Gio from "gi://Gio?version=2.0";
import { getter, setter, iface, method, property, Service, signal } from "gnim/dbus";
import { Media as VibeMedia } from "libvibe/interfaces";
import { App } from "../app";
import GLib from "gi://GLib?version=2.0";
import GObject from "gnim/gobject";
import Media from "./media";
import { createBinding, createComputed } from "gnim";
import { createSubscription } from "gnim-utils";
import Gst from "gi://Gst?version=1.0";
import { Song } from "libvibe/objects";
import { Image } from "libvibe/utils";


@iface("org.mpris.MediaPlayer2", { GTypeName: "VibeMpris" })
export class Mpris extends Service {
    private static instance: Mpris|null;
    private static player: Mpris.Player|null;

    // data
    @getter("s") get Identity() { return "Vibe"; }
    @getter("s") get DesktopEntry() { return "io.github.retrozinndev.Vibe"; }

    // capabilities
    @property("b") Fullscreen: boolean = false;
    @getter("b") get CanQuit() { return true; }
    @getter("b") get CanSetFullscreen() { return false; }
    @getter("b") get CanRaise() { return true; }
    @getter("b") get HasTrackList() { return false; }
    @getter("as") get SupportedUriSchemes() { return []; }
    @getter("as") get SupportedMimeTypes() { return []; }


    constructor() {
        super();
        this.serve({
            busType: Gio.BusType.SESSION,
            flags: Gio.BusNameOwnerFlags.DO_NOT_QUEUE,
            name: "org.mpris.MediaPlayer2.vibe",
            objectPath: "/org/mpris/MediaPlayer2"
        });

        Mpris.player = new Mpris.Player(); // create player
    }

    /** ride the mpris bus */
    public static init(): void {
        if(Mpris.instance) {
            console.log("Mpris: Can't initialize, service is already running");
            return;
        }

        Mpris.instance = new Mpris();
    }

    public static stop(): void {
        if(!Mpris.instance) {
            console.log("Mpris: Can't stop service, no instance is running");
            return;
        }

        Mpris.player!.stop();
        Mpris.instance.stop();
        Mpris.player = null;
        Mpris.instance = null;
    }

    
    @method() Raise(): void {
        App.get_default().get_main_window().show();
    }

    @method() Quit(): void {
        App.get_default().quit();
    }
}

export namespace Mpris {
    export enum LoopMode {
        NONE = "None",
        TRACK = "Track",
        PLAYLIST = "Playlist"
    }

    export enum PlaybackStatus {
        STOPPED = "Stopped",
        PLAYING = "Playing",
        PAUSED = "Paused"
    }

    export type Meta = Partial<Record<
        "mpris:artUrl" 
        | "mpris:trackId"
        | "mpris:length" 
        | "xesam:album"
        | "xesam:albumArtist"
        | "xesam:artist"
        | "xesam:autoRating"
        | "xesam:discNumber"
        | "xesam:title"
        | "xesam:trackNumber"
        | "xesam:url"
    , GLib.Variant>>;

    
    @iface("org.mpris.MediaPlayer2.Player", {
        GTypeName: "VibeMprisPlayer"
    })
    export class Player extends Service {   
        declare $signals: Player.SignalSignatures;

        #Metadata: Mpris.Meta = {
            "xesam:title": GLib.Variant.new_string("No Title"),
            "xesam:artist": GLib.Variant.new_array(
                GLib.VariantType.new("s"),
                [GLib.Variant.new_string("No Artist")]
            )
        };
        #CanGoNext: boolean = true;
        #CanGoPrevious: boolean = true;
        #CanPlay: boolean = true;
        #CanPause: boolean = true;
        #CanSeek: boolean = false;
        #CanControl: boolean = false;

        // signals
        @signal("x") Seeked(_: number) {}

        // data
        @getter("s") get PlaybackStatus() { return this.translatePlayback(Media.getDefault().status); }
        @getter("s") get LoopStatus() { return this.translateLoop(Media.getDefault().loop); }
        @setter("s") set LoopStatus(status: Mpris.LoopMode) {
            switch(status) {
                case Mpris.LoopMode.TRACK:
                    Media.getDefault().loop = VibeMedia.LoopMode.SONG;
                break;

                case Mpris.LoopMode.PLAYLIST:
                    Media.getDefault().loop = VibeMedia.LoopMode.LIST;
                break;

                default:
                    Media.getDefault().loop = VibeMedia.LoopMode.NONE;
            }

            this.notify("LoopStatus");
        }
        @getter("d") get MinimumRate() { return 1.0; }
        @getter("d") get Rate() { return 1.0; }
        @getter("d") get MaximumRate() { return 1.0; }
        @getter("b") get Shuffle() { return Media.getDefault().shuffle !== VibeMedia.ShuffleMode.NONE; }
        @setter("b") set Shuffle(enabled: boolean) {
            Media.getDefault().shuffle = enabled ?
                VibeMedia.ShuffleMode.SHUFFLE
            : VibeMedia.ShuffleMode.NONE;

            this.notify("Shuffle");
        }
        @getter("a{sv}") get Metadata() { return this.#Metadata; }
        @property("d") Volume: number = 1.0;
        @getter("x") get Position() { return this.secToMicrosec(Media.getDefault().position); }

        // capabilities
        @getter("b") get CanGoNext() { return this.#CanGoNext; }
        @getter("b") get CanGoPrevious() { return this.#CanGoPrevious; }
        @getter("b") get CanPlay() { return this.#CanPlay; }
        @getter("b") get CanPause() { return this.#CanPause; }
        @getter("b") get CanSeek() { return this.#CanSeek; }
        @getter("b") get CanControl() { return this.#CanControl; }


        constructor() {
            super();
            this.serve({
                busType: Gio.BusType.SESSION,
                flags: Gio.BusNameOwnerFlags.DO_NOT_QUEUE,
                name: "org.mpris.MediaPlayer2.vibe",
                objectPath: "/org/mpris/MediaPlayer2"
            });

            createSubscription(
                createBinding(Media.getDefault(), "status"),
                () => {
                    const status = Media.getDefault().status;
                    this.notify("PlaybackStatus");

                    switch(status) {
                        case VibeMedia.PlaybackStatus.PAUSED:
                            this.#CanPause = false;
                            this.#CanPlay = true;
                            this.notify("CanPause")
                            this.notify("CanPlay");
                        return;

                        case VibeMedia.PlaybackStatus.PLAYING:
                            this.#CanPause = true;
                            this.#CanPlay = false;
                            this.notify("CanPause")
                            this.notify("CanPlay");
                        return;
                    }

                    this.#CanPlay = false;
                    this.#CanPause = false;
                    this.notify("CanPause")
                    this.notify("CanPlay");
                }
            );

            createSubscription(
                createBinding(Media.getDefault(), "position"),
                () => this.notify("Position")
            );

            createSubscription(
                createBinding(Media.getDefault(), "length"),
                () => {
                    this.Metadata["mpris:length"] = GLib.Variant.new_int64(
                        this.secToMicrosec(Media.getDefault().length)
                    );
                    this.notify("Metadata");
                }
            );

            createSubscription(
                createBinding(Media.getDefault(), "loop"),
                () => this.notify("LoopStatus")
            );

            const songData = createComputed(() => {
                const song = createBinding(Media.getDefault(), "song")();
                const image = createBinding(Media.getDefault(), "song", "image")();
                const albumImage = createBinding(Media.getDefault(), "song", "album", "image")();

                return [song, (image ?? albumImage ?? null)];
            })
            createSubscription(
                songData,
                () => {
                    const [song, image] = songData.peek() as [Song, Image];

                    if(!song) {
                        this.#Metadata = {
                            "xesam:title": GLib.Variant.new_string("Nothing is Playing"),
                            "xesam:album": GLib.Variant.new_string("No Album"),
                            "mpris:length": GLib.Variant.new_int16(0),
                            "xesam:trackNumber": GLib.Variant.new_int16(0),
                            "xesam:discNumber": GLib.Variant.new_int16(0),
                        };
                        this.notify("Metadata");

                        this.#CanPlay = false;
                        this.#CanSeek = false;
                        this.#CanPause = false;
                        this.#CanGoNext = false;
                        this.#CanGoPrevious = false;
                        this.#CanControl = false;
                        this.notify("CanPause")
                        this.notify("CanPlay");
                        this.notify("CanSeek");
                        this.notify("CanGoNext");
                        this.notify("CanGoPrevious");
                        this.notify("CanControl");

                        return;
                    }


                    this.#CanSeek = true;
                    this.#CanGoNext = true;
                    this.#CanGoPrevious = true;
                    this.#CanControl = true;
                    this.notify("CanSeek");
                    this.notify("CanGoNext");
                    this.notify("CanGoPrevious");
                    this.notify("CanControl");

                    this.#Metadata = {
                        "xesam:title": GLib.Variant.new_string(song.title ?? "Untitled"),
                        "xesam:artist": GLib.Variant.new_array(
                            GLib.VariantType.new("s"),
                            song.artist.map(artist =>
                                GLib.Variant.new_string(artist.displayName ?? artist.name 
                                    ?? "Unknown Artist"
                                )
                            )
                        ),
                        "xesam:trackNumber": GLib.Variant.new_int16(song.trackNumber),
                        "xesam:discNumber": GLib.Variant.new_int16(song.discNumber),
                        "xesam:albumArtist": GLib.Variant.new_array(
                            GLib.VariantType.new("s"),
                            song.album?.artist?.map(artist => 
                                GLib.Variant.new_string(artist.displayName ?? artist.name ?? "Unknown Artist")
                            ) ?? []
                        )
                    };

                    if(song.album && song.album.title !== null)
                        this.#Metadata["xesam:album"] = GLib.Variant.new_string(song.album.title);

                    if(image && image.cacheFile)
                        this.#Metadata["mpris:artUrl"] = GLib.Variant.new_string(`file://${image.cacheFile?.peek_path()}`);

                    this.notify("Metadata");
                }
            );
        }

        @method() Next(): void {
            Media.getDefault().next();
        }

        @method() Previous(): void {
            Media.getDefault().previous();
        }

        @method() Pause(): void {
            Media.getDefault().pause();
        }

        @method() Play(): void {
            Media.getDefault().resume();
        }

        @method() PlayPause(): void {
            if(!Media.getDefault().song)
                return;

            Media.getDefault().status === VibeMedia.PlaybackStatus.PLAYING ?
                Media.getDefault().pause()
            : Media.getDefault().resume();
        }

        @method("x") Seek(pos: number): void {
            Media.getDefault().position = this.microsecToSec(pos);
            this.emit("Seeked", pos);
        }

        @method("o", "x") SetPosition(_: string, pos: number): void {
            Media.getDefault().position = this.microsecToSec(pos); // pos is in microseconds, while the actual property in `Media` is in nanoseconds
        }

        @method("s") OpenUri(_: string) {}

        
        protected translatePlayback(status: VibeMedia.PlaybackStatus): Mpris.PlaybackStatus {
            switch(status) {
                case VibeMedia.PlaybackStatus.PLAYING:
                    return Mpris.PlaybackStatus.PLAYING;

                case VibeMedia.PlaybackStatus.PAUSED:
                    return Mpris.PlaybackStatus.PAUSED;

                // the LOADING status is almost the same as STOPPED (mpris only supports these three values anyways)
            }

            return Mpris.PlaybackStatus.STOPPED;
        }

        protected translateLoop(loop: VibeMedia.LoopMode): Mpris.LoopMode {
            switch(loop) {
                case VibeMedia.LoopMode.LIST:
                    return Mpris.LoopMode.PLAYLIST;

                case VibeMedia.LoopMode.SONG:
                    return Mpris.LoopMode.TRACK;
            }

            return Mpris.LoopMode.NONE;
        }

        protected secToMicrosec(seconds: number): number {
            return Math.floor(seconds * (Gst.SECOND / 1000));
        }

        protected microsecToSec(us: number): number {
            return us / (Gst.SECOND / 1000);
        }
    }

    export namespace Player {
        export interface SignalSignatures extends GObject.Object.SignalSignatures {
            "Seeked": (position: number) => void;
        }
    }
}
