import Gst from "gi://Gst?version=1.0";
import { createRoot, getScope, Scope } from "gnim";
import { createScopedConnection } from "gnim-utils";
import GObject, { getter, gtype, property, register } from "gnim/gobject";
import { Media as VibeMedia, LoopMode, ShuffleMode, PlaybackStatus } from "libvibe/interfaces";
import { Song, SongList, Queue } from "libvibe/objects";


/** play and control media from plugins
* @todo */
@register({ GTypeName: "VibeMedia" })
export default class Media extends GObject.Object implements VibeMedia {
    private static instance: VibeMedia;

    readonly #playbin!: Gst.Pipeline;
    #scope: Scope;
    #gstBus: Gst.Bus;
    #queue: Queue = new Queue();
    #status: PlaybackStatus = PlaybackStatus.STOPPED;
    #song: Song|null = new Song({
        name: "Nothing is Playing"
    });
    
    /** the active song, can be null */
    @getter(gtype<Song|null>(Song)) 
    get song() { return this.#song; }

    @getter(gtype<SongList|null>(SongList))
    get queue() { return this.#queue; }

    @getter(gtype<PlaybackStatus>(Number))
    get status() { return this.#status; }

    @property(gtype<LoopMode>(Number))
    loop: LoopMode = LoopMode.NONE;

    @property(gtype<ShuffleMode>(Number))
    shuffle: ShuffleMode = ShuffleMode.NONE;

    constructor() {
        super();

        Gst.init([]);
        if(!Gst.is_initialized())
            throw new Error("Gst didn't get initialized! abort!!");

        this.#playbin = Gst.ElementFactory.make("playbin", "vibe_player") as Gst.Pipeline;
        this.#gstBus = this.#playbin.get_bus();
        
        this.#scope = createRoot(() => {
            createScopedConnection(this.#gstBus, "message", (msg) => {
                console.log(msg);
            });

            return getScope();
        });
    }

    vfunc_dispose(): void {
        this.#scope.dispose();
        this.#playbin.set_state(Gst.State.NULL);
        this.#playbin.run_dispose();
    }

    public static getDefault(): VibeMedia {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }

    public playSong(song: Song, pos: number): void {
        if(!song.file || song.stream) {
            console.error("Song does not have a file set or it's invalid");
            console.error("Notice that raw streams are not yet supported by the player! \
The dev is working hard on that ;D (it's my first time using gstreamer)");
            return;
        }

        this.#song = song;
        this.notify("song");
        this.#queue.clear();

        this.#playbin.set_state(Gst.State.NULL);
        this.#playbin.seek_simple(null, Gst.SeekFlags.FLUSH, pos);
        this.#playbin.set_property("uri", `file://${song.file.peek_path()!}`);
        this.#playbin.set_state(Gst.State.PLAYING);
        this.#status = PlaybackStatus.PLAYING;
        this.notify("status");
    }

    public playList(list: SongList, posNum: number): void {
        
    }

    public resume(): void {
        if(this.#status !== PlaybackStatus.PAUSED)
            return;

        this.#playbin.set_state(Gst.State.PLAYING);
        this.#status = PlaybackStatus.PLAYING;
        this.notify("status");
    }
    public pause(): void {
        if(this.#status !== PlaybackStatus.PLAYING)
            return;

        this.#playbin.set_state(Gst.State.PAUSED);
        this.#status = PlaybackStatus.PAUSED;
        this.notify("status");
    }

    // TODO we need the loopmode logics for this one!!
    // ts might be the best software of november! :D (joke)
    public next(): void {}
    public previous(): void {}
}
