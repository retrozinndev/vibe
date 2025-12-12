import Gst from "gi://Gst?version=1.0";
import { createRoot, getScope, Scope } from "gnim";
import { createScopedConnection } from "gnim-utils";
import GObject, { getter, gtype, property, register, setter } from "gnim/gobject";
import { LoopMode, PlaybackStatus, ShuffleMode, Media as VibeMedia } from "libvibe/interfaces";
import { Song, SongList, Queue } from "libvibe/objects";


/** play and control media from plugins */
@register({ GTypeName: "VibeMedia" })
export default class Media extends GObject.Object implements VibeMedia {
    private static instance: VibeMedia;

    readonly #playbin!: Gst.Pipeline;
    #scope: Scope;
    #length: number = 0;
    #position: number = 0;
    #gstBus: Gst.Bus;
    #queue: Queue = new Queue();
    #status: PlaybackStatus = PlaybackStatus.STOPPED;
    #song: Song|null = null;
    
    /** the active song, can be null */
    @getter(gtype<Song|null>(Song)) 
    get song() { return this.#song; }

    @getter(gtype<SongList|null>(SongList))
    get queue() { return this.#queue; }

    @getter(gtype<PlaybackStatus>(Number))
    get status() { return this.#status; }

    @getter(Number)
    get length() { return this.#length; }

    @getter(Number)
    get position() { return this.#position; }

    @setter(Number)
    set position(newPos: number) {
        if(!this.#song || this.#status === PlaybackStatus.STOPPED)
            return;

        this.#playbin.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, newPos);
    }

    @property(gtype<LoopMode>(Number))
    loop: LoopMode = LoopMode.NONE;

    @property(gtype<ShuffleMode>(Number))
    shuffle: ShuffleMode = ShuffleMode.NONE;

    constructor() {
        super();

        Gst.init([]);
        if(!Gst.is_initialized())
            throw new Error("Gst didn't get initialized! abort!!");

        this.#playbin = Gst.ElementFactory.make("playbin3", "vibe_player") as Gst.Pipeline;
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
        if(this.play(song, pos, Gst.State.PLAYING)) {
            this.#queue.clear();
            this.#queue.add(song);
            this.#queue.currentSong = 0;
            return;
        }

        console.error(`Couldn't play the song that was requested! (id: ${song.id})`);
    }

    public playList(list: SongList, posNum: number): void {
        if(list.songs.length < 1)
            return;

        if(list !instanceof Queue) { 
            this.#queue.clear();
            list.songs.forEach(song => this.#queue.add(song));
            this.notify("queue");
        }

        if(list.songs[posNum] == null) {
            console.error(`Couldn't play song in position ${posNum} of the songlist with id: ${list.id
                }. Falling back to playing the first song`);

            this.play(this.#queue.songs[0]);
            return;
        }

        this.#queue.currentSong = posNum;
        this.play(this.#queue.songs[posNum]);
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

    public next(): void {
        if(this.#queue.songs.length < 1 || !this.#song)
            return;

        // if the user clearly clicked in the "next" button, they don't want this anymore(probably)
        // maybe doing a config to enable/disable this function can avoid user angriness :P
        if(LoopMode.SONG)
            this.loop = LoopMode.LIST;

        const nextSong: Song|undefined = this.#queue.get(this.#queue.currentSong+1);
        if(nextSong) { // it has a next song in the queue
            this.play(nextSong);
            return;
        }

        // the previous song was the last, so we loop the queue if it's enabled
        // (this also works if it there's a single song in the queue)
        if(this.loop === LoopMode.LIST) 
            this.play(this.#queue.get(0)!);
    }

    public previous(): void {
        // also making this behavior a configurable thing would be nice
        if(this.#song && (this.#queue.songs.length < 2 || this.getPosition() >= (Gst.SECOND * 3))) {
            this.position = 0;
            return;
        }

        if(this.loop === LoopMode.SONG)
            this.loop = LoopMode.LIST;

        const previousSong = this.#queue.currentSong > -1 &&
            this.#queue.get(this.#queue.currentSong-1);

        // there is a previous song to play
        if(previousSong) {
            this.play(previousSong);
            return;
        }

        // there's no previous song, so we go to the end of the list(if loop mode is LIST)
        if(this.loop === LoopMode.LIST)
            this.play(this.#queue.get(this.#queue.songs.length-1)!);
    }


    /** @private song play implementation, overwrites current song and ignores queue
      * this method only plays the song using gst playbin and nothing more. 
      *
      * @throws {@link Gst.CoreError}
      * @returns true on success, or else false */
    private play(song: Song, pos: number = 0, initialState: Gst.State = Gst.State.PLAYING): boolean {
        if(!song.source || song.source instanceof Gst.Stream) {
            console.error("Song does not have a file set or it's invalid");
            console.error("Notice that raw streams are not yet supported by the player! \
The dev is working hard on that ;D (it's my first time using gstreamer)");
            return false;
        }

        this.#song = song;
        this.notify("song");

        this.#playbin.set_state(Gst.State.NULL);
        this.#playbin.set_property("uri", `file://${song.source.peek_path()!}`);
        this.#playbin.seek_simple(null, Gst.SeekFlags.FLUSH, pos);

        this.position = this.#playbin.query_position(Gst.Format.TIME)[1];
        this.notify("position");

        this.#length = this.#playbin.query_duration(Gst.Format.TIME)[1] / (Gst.SECOND);
        this.notify("length");

        this.#playbin.set_state(initialState);

        this.#status = this.stateToPlaybackStatus(initialState);
        this.notify("status");

        return true;
    }

    private stateToPlaybackStatus(state: Gst.State): PlaybackStatus {
        switch(state) {
            case Gst.State.PAUSED:
                return PlaybackStatus.PAUSED;

            case Gst.State.NULL:
                return PlaybackStatus.STOPPED;
        }

        return PlaybackStatus.PLAYING;
    }

    /** @returns the playbin3 position in nanoseconds */
    private getPosition(): number {
        return this.#playbin.query_position(Gst.Format.TIME)[1];
    }
}
