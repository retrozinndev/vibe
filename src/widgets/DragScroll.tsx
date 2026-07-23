import Gtk from "gi://Gtk?version=4.0";
import { register, getter, property } from "gnim/gobject";
import GObject from "gi://GObject?version=2.0";
import { createScopedConnection } from "gnim-utils";
import GLib from "gi://GLib?version=2.0";


/** GtkScrolledWindow that allows the user to scroll by dragging their mouse */
@register({ GTypeName: "VibeDragScroll" })
export class DragScroll extends Gtk.ScrolledWindow {
    declare readonly $readableProperties: DragScroll.ReadableProperties;
    declare readonly $readWriteProperties: DragScroll.ReadWriteProperties;

    #drag: Gtk.GestureDrag;
    #scrollStart: [number, number] = [0, 0];

    @getter(Boolean)
    get dragging() { return this.#drag.is_recognized(); }

    /** avoids propagating a secondary event on ::drag-end if it's outside the `grabRange`.
      * @default `0` */
    @property(Number)
    grabRange: number = .000005;

    constructor(props: Partial<GObject.ConstructorProps<DragScroll>>) {
        super(props);

        this.#drag = Gtk.GestureDrag.new();
        createScopedConnection(this.#drag, "drag-begin", () => {
            this.#scrollStart.splice(0, 2, this.get_hadjustment().get_value(), this.get_vadjustment().get_value());
            this.notify("dragging");
        });
        createScopedConnection(this.#drag, "drag-update", (offX, offY) => {
            if(Math.abs(offX) > this.grabRange || Math.abs(offY) > this.grabRange)
                this.#drag.set_state(Gtk.EventSequenceState.CLAIMED);

            GLib.idle_add(GLib.PRIORITY_LOW, () => {
                const [scrollH, scrollV] = this.#scrollStart;
                const h = this.get_hadjustment(), v = this.get_vadjustment();

                h.set_value(scrollH - offX);
                v.set_value(scrollV - offY);

                return GLib.SOURCE_REMOVE;
            });
        });
        createScopedConnection(this.#drag, "drag-end", () => {
            // TODO overshoot (keep scrolling with ease-out)
            this.notify("dragging");
            this.#drag.set_state(Gtk.EventSequenceState.NONE);
        });

        this.add_controller(this.#drag);
    }

    getDrag(): Gtk.GestureDrag {
        return this.#drag;
    }
}

export namespace DragScroll {
    export interface ReadWriteProperties extends Gtk.ScrolledWindow.ReadWriteProperties {}
    export interface ReadableProperties extends Gtk.ScrolledWindow.ReadableProperties {
        "dragging": boolean;
    }
}
