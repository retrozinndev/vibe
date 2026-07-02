import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";


// TODO support other animation types(like ease-in, ease-out and maybe custom?)
/** animate a widget's something... yeah */
class Animation<T extends Gtk.Widget = Gtk.Widget> {
    protected last: number|null = null;
    protected get: () => number;
    protected set: (v: number) => void;

    public readonly widget: T;
    /** animation duration in millis. @default `400` */
    public duration: number;
    public type: Animation.Type;


    /** the parameters `get` and `set` are generic, you can use them for whatever
      * you want to animate in `widget`.
      *
      * @param get the method used to get the current value (progress, basically) 
      * @param set the setter method, to update the value (e.g.: a widget's position) */
    constructor({
        widget,
        duration = 400,
        type = Animation.Type.LINEAR,
        get, set
    }: {
        widget: T;
        type?: Animation.Type;
        duration?: number;
        get(): number;
        set(v: number): void;
    }) {
        this.widget = widget;
        this.duration = duration;
        this.type = type;
        this.get = get;
        this.set = set;
    }

    /** begins the animation. 
      * @param onEnd callback executed when the animation ends(skipped if animation is stopped) 
      *
      * @returns the animation ID that can be used to stop its progress */
    public start(
        target: number,
        onEnd?: () => void
    ): void {

        let startTime: number|null = null;

        this.stop();
        this.last = this.widget.add_tick_callback((_, clock) => {
            const time = clock.get_frame_time() / 1000;
            startTime ??= time;
            const fraction = Math.min(1, (time - startTime) / this.duration);

            if(fraction < 1) {
                const value = this.get() + (target - this.get()) * fraction;
                this.set(value);

                return GLib.SOURCE_CONTINUE;
            }

            startTime = null;
            this.last = null;
            onEnd?.();
            return GLib.SOURCE_REMOVE;
        });
    }

    /** stop the last-started animation(if there is such)
      * this is basically a wrapper around `Gtk.Widget.remove_tick_callback`. */
    public stop(): void {
        if(this.last == null)
            return;

        this.widget.remove_tick_callback(this.last);
        this.last = null;
        return;
    }
}

namespace Animation {
    export enum Type {
        LINEAR = 0
    }
}

export default Animation;
