import Gtk from "gi://Gtk?version=4.0";
import { property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import GLib from "gi://GLib?version=2.0";


/** a scrolling widget that reveals it's content procedurally */
@register()
export class Scroller extends Gtk.Viewport {

    #reachedEnd: boolean = false;

    /** the amount of pixels which the scroller should scroll. @default 2 */
    @property(Number)
    increment: number = 2;

    /** whether the animation should stop when the widget is hovered */
    @property(Boolean)
    pauseOnHover: boolean = true;

    /** the widget orientation. @default `HORIZONTAL` */
    @property(Gtk.Orientation)
    orientation: Gtk.Orientation = Gtk.Orientation.HORIZONTAL;


    constructor(props: Partial<Scroller.ConstructorProps>) {
        super(omitObjectKeys(props, [
            "increment"
        ]));

        const src = GLib.idle_source_new();
        src.set_priority(GLib.PRIORITY_LOW);
        src.set_callback(() => this.animate?.());
        src.attach();
    }

    /** animation callback method, this is called for each draw.
      * @returns true if the animation should continue happening, false if it should completely stop */
    protected animate(): boolean {
        console.log("ran the animation callback for scroller!");
        // TODO the whole animation logic lol
        const adjustment = this.orientation === Gtk.Orientation.HORIZONTAL ?
            this.get_hadjustment()!
        : this.get_vadjustment()!;
        const value = adjustment.get_value(),
            max = adjustment.get_page_size();

        if(max === 0)
            return true; // don't animate if there's no hidden content

        if(this.#reachedEnd && value <= 0) {
            this.#reachedEnd = false;
            return true;
        }

        if(this.#reachedEnd || (this.increment + value) >= max) {
            this.#reachedEnd ||= true;
            adjustment.set_value(value - this.increment); // i don't think this variable name is great for this lol
            return true;
        }

        adjustment.set_value(value + this.increment);

        return true;
    }
}

export namespace Scroller {
    export interface SignalSignatures extends Gtk.Viewport.SignalSignatures {
        "notify::speed": () => void;
    }

    export interface ConstructorProps extends Gtk.Viewport.ConstructorProps {
        increment: number;
        pauseOnHover: boolean;
        orientation: Gtk.Orientation;
    }
}
