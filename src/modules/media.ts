import GLib from "gi://GLib?version=2.0";
import Gst from "gi://Gst?version=1.0";
import { createRoot, getScope, Scope } from "gnim";
import GObject, { getter, gtype, property, register, setter, signal } from "gnim/gobject";
import { LoopMode, MediaSignalSignatures, PlaybackStatus, ShuffleMode, Media as VibeMedia } from "libvibe/interfaces";
import { Song, SongList, Queue } from "libvibe/objects";


/** play and control media from plugins */
@register({ GTypeName: "VibeMedia" })
export default class Media extends GObject.Object implements VibeMedia {
    private static instance: Media;

    declare $signals: MediaSignalSignatures;

    #scope: Scope = createRoot(() => getScope());
    #pipeline!: Gst.Pipeline;
    #length: number = 0;
    #position: number = 0;
    #queue: Queue = new Queue();
    #status: PlaybackStatus = PlaybackStatus.STOPPED;
    #intervals: Array<GLib.Source> = [];
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

        this.#pipeline?.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, newPos * Gst.SECOND);
    }

    @property(gtype<LoopMode>(Number))
    loop: LoopMode = LoopMode.NONE;

    @property(gtype<ShuffleMode>(Number))
    shuffle: ShuffleMode = ShuffleMode.NONE;

    @signal(GObject.Object)
    playing(_: Song) {}

    @signal(GObject.Object)
    paused(_: Song) {}

    @signal(GObject.Object)
    resumed(_: Song) {}

    @signal(GObject.Object, Number)
    gonePrevious(_: Song, __: number) {}

    @signal(GObject.Object, Number)
    goneNext(_: Song, __: number) {}

    constructor() {
        super();

        Gst.init([]);
        if(!Gst.is_initialized())
            throw new Error("Gstreamer couldn't get initialized! abort!!");
    }

    vfunc_dispose(): void {
        this.#pipeline?.set_state(Gst.State.NULL);
        this.#scope.dispose();
    }

    public static getDefault(): Media {
        if(!this.instance)
            this.instance = new Media();

        return this.instance;
    }

    public playSong(song: Song, pos: number): void {
        if(this.play(song, pos, Gst.State.PLAYING)) {
            this.#queue.clear();
            this.#queue.add(song);
            this.#queue.currentSong = 0;
            this.emit("playing", song);
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
        if(!this.#song || this.#status !== PlaybackStatus.PAUSED)
            return;

        this.#pipeline?.set_state(Gst.State.PLAYING);
        this.#status = PlaybackStatus.PLAYING;
        this.notify("status");
        this.emit("resumed", this.#song);
    }

    public pause(): void {
        if(this.#status !== PlaybackStatus.PLAYING)
            return;

        this.#pipeline?.set_state(Gst.State.PAUSED);
        this.#status = PlaybackStatus.PAUSED;
        this.emit("paused", this.#song!);
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
            this.#queue.currentSong++;
            this.play(nextSong);
            this.emit("gone-next", nextSong, this.#queue.currentSong);
            return;
        }

        // the previous song was the last, so we loop back the queue(if mode is LIST)
        // (this also works if it there's a single song in the queue)
        if(this.loop === LoopMode.LIST) {
            const firstSong = this.#queue.get(0)!;
            this.#queue.currentSong = 0;
            this.play(firstSong);
            this.emit("gone-next", firstSong, 0);
        }
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
            this.#queue.currentSong--;
            this.play(previousSong);
            this.emit("gone-previous", previousSong, this.#queue.currentSong);
            return;
        }

        // there's no previous song, so we loop back to the last(if mode is LIST)
        if(this.loop === LoopMode.LIST) {
            this.#queue.currentSong = this.#queue.songs.length - 1;
            const lastSong = this.#queue.get(this.#queue.currentSong)!;

            this.play(lastSong);
            this.emit("gone-previous", lastSong, this.#queue.currentSong);
        }
    }

    private addPipelineWatch(): void {
        if(!this.#pipeline)
            throw new Error("Media: Couldn't get any pipeline to watch data");

        const bus = this.#pipeline.get_bus();

        bus.add_watch(GLib.PRIORITY_DEFAULT, (_, msg) => {
            switch(msg.type) {
                case Gst.MessageType.EOS:
                    this.#song = null;
                    this.notify("song");

                    break;
            }

            if(this.loop !== LoopMode.NONE) {
                this.next();

                return false;
            }

            return true;
        });
    }

    public addPositionCheckIntervals(): void {
        if(this.#intervals.length > 0) 
            this.#intervals.splice(0, this.#intervals.length).forEach(interv => interv.destroy());

        this.#intervals.push(
            setInterval(() => {
                if(!this.#song || this.#status !== PlaybackStatus.PLAYING) 
                    return;

                this.#position = this.#pipeline.query_position(Gst.Format.TIME)[1] / Gst.SECOND;
                this.notify("position");
                this.#length = this.#pipeline.query_duration(Gst.Format.TIME)[1] / Gst.SECOND;
                this.notify("length");
            }, 1000)
        );
    }

    /** @private song play implementation, overwrites current song and ignores queue.
      * this method only plays the song using a gstreamer pipeline and nothing more. 
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

        this.#pipeline?.set_state(Gst.State.NULL);
        this.#pipeline?.get_bus().remove_signal_watch()
        this.#pipeline = Gst.Pipeline.new("main-pipeline");

        const playbin = Gst.ElementFactory.make("playbin3", "player")!;

        this.#pipeline.add(playbin);
        playbin.set_property("video-sink", null);
        playbin.set_property("uri", `file://${song.source.peek_path()!}`);
    
        this.#pipeline.seek_simple(Gst.Format.TIME, Gst.SeekFlags.FLUSH, pos);
        this.addPipelineWatch();
        this.addPositionCheckIntervals();
        this.#pipeline.set_state(initialState);

        this.#position = pos;
        this.notify("position");
        this.#length = this.#pipeline.query_duration(Gst.Format.TIME)[1] / Gst.SECOND;
        this.notify("length");
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
        return this.#pipeline!.query_position(Gst.Format.TIME)[1];
    }

    emit<S extends keyof MediaSignalSignatures>(
        signal: S,
        ...args: Parameters<MediaSignalSignatures[S]>
    ): void {
        super.emit(signal, ...args);
    }

    connect<S extends keyof MediaSignalSignatures>(
        signal: S, 
        callback: (self: typeof this, ...args: Parameters<MediaSignalSignatures[S]>) => ReturnType<MediaSignalSignatures[S]>
    ): number {
        return super.connect(signal, callback);
    }
}
