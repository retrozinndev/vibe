import Gtk from "gi://Gtk?version=4.0";
import GLib from "gi://GLib?version=2.0";
import { register, property } from "gnim/gobject";
import GObject from "gi://GObject?version=2.0";
import { omitObjectKeys } from "../modules/util";


/** adds animated scrolling methods to GtkScrolledWindow */
@register({ GTypeName: "VibeAnimatedScroll" })
export class AnimatedScroll extends Gtk.ScrolledWindow {
    declare readonly $readWriteProperties: AnimatedScroll.ReadWriteProperties;

    #hAnimId: number|null = null;
    #vAnimId: number|null = null;
    
    /** animation duration in millis. @default `400` */
    @property(Number)
    duration: number = 400;


    constructor(props: Partial<GObject.ConstructorProps<AnimatedScroll>>) {
        super({
            hscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
            vscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
            ...omitObjectKeys(props, ["duration"])
        });
    }

    protected animate(
        target: number,
        get: () => number,
        set: (v: number) => void,
        onEnd?: () => void
    ): number {

        let startTime: number|null = null;

        return this.add_tick_callback((_, clock) => {
            const time = clock.get_frame_time() / 1000;
            startTime ??= time;
            const fraction = Math.min(1, (time - startTime) / this.duration);

            if(fraction < 1) {
                const value = get() + (target - get()) * fraction;
                set(value);

                return GLib.SOURCE_CONTINUE;
            }

            startTime = null;
            onEnd?.();
            return GLib.SOURCE_REMOVE;
        });
    }

    /** stop animation by id (if no id, stop everything) */
    protected stopAnimation(id?: number|null): void {
        if(id == null) {
            this.#hAnimId != null &&
                this.remove_tick_callback(this.#hAnimId);
            this.#vAnimId != null &&
                this.remove_tick_callback(this.#vAnimId);

            this.#hAnimId &&= null;
            this.#vAnimId &&= null;

            return;
        }

        this.remove_tick_callback(id);
    }


    scroll(x?: number, y?: number): void {
        if(x != null) {
            this.#hAnimId != null &&
                this.stopAnimation(this.#hAnimId);
            
            this.#hAnimId = this.animate(x!,
                () => this.get_hadjustment()!.get_value(),
                (v) => this.get_hadjustment()!.set_value(v),
                () => this.#hAnimId = null
            );
        }

        if(y != null) {
            this.#vAnimId != null &&
                this.stopAnimation(this.#vAnimId);

            this.#vAnimId = this.animate(y!,
                () => this.get_vadjustment()!.get_value(),
                (v) => this.get_vadjustment()!.set_value(v),
                () => this.#vAnimId = null
            );
        }
    }
}

export namespace AnimatedScroll {
    export interface ReadWriteProperties extends Gtk.ScrolledWindow.ReadWriteProperties {
        "duration": number;
    }
}
