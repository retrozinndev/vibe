import Gtk from "gi://Gtk?version=4.0";
import { gtype, property, register } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { createBinding, createComputed } from "gnim";
import Adw from "gi://Adw?version=1";


/** a widget inspired by AdwCarousel and GtkScrolledWindow.
  * it's basically a GtkScrolledWindow, but without the scroll bar and with side-navigation arrow buttons */
@register({ GTypeName: "VibeScrolledCarousel" })
export class ScrolledCarousel extends Adw.Bin {
    #scroll: Gtk.ScrolledWindow;
    #overlay: Gtk.Overlay;

    @property(gtype<Gtk.Orientation>(Number))
    orientation: Gtk.Orientation = Gtk.Orientation.HORIZONTAL;

    @property(Number)
    scrollAmount: number = 50;

    constructor(props: Partial<ScrolledCarousel.ConstructorProps>) {
        super(omitObjectKeys(props, [
            "scrollAmount",
            "orientation"
        ]));

        if(props.scrollAmount !== undefined)
            this.scrollAmount = props.scrollAmount;


        this.#scroll = Gtk.ScrolledWindow.new();
        this.#overlay = Gtk.Overlay.new();

        this.#scroll.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.NEVER);
        
        const overlayContent: Gtk.Widget = <Gtk.Box>
            <Gtk.Button iconName={"go-previous-symbolic"} halign={Gtk.Align.START}
              visible={createComputed(() => {
                  const orientation = createBinding(this, "orientation")();
                  const adjustment = orientation === Gtk.Orientation.HORIZONTAL ?
                      this.#scroll.get_hadjustment()
                  : this.#scroll.get_vadjustment();

                  return adjustment ? createBinding(adjustment, "value")(v => v > 0)() : false;
              })}
            />
            <Gtk.Button iconName={"go-next-symbolic"} halign={Gtk.Align.END}
              visible={createComputed(() => {
                  const orientation = createBinding(this, "orientation")();
                  const adjustment = orientation === Gtk.Orientation.HORIZONTAL ?
                      this.#scroll.get_hadjustment()
                  : this.#scroll.get_vadjustment();
                  const max = createBinding(this.#scroll, "child")()?.get_width() ?? 0;

                  return adjustment ? createBinding(adjustment, "value")(v => v < max)() : false;
              })}
            />
        </Gtk.Box> as Gtk.Box;

        this.#overlay.set_child(overlayContent);

        this.set_child(
            <Gtk.Box>
                {this.#scroll}
                {this.#overlay}
            </Gtk.Box> as Gtk.Box
        );

        this.#overlay.set_clip_overlay(overlayContent, true);
    }

    getViewport(): Gtk.Viewport {
        return this.#scroll.get_child() as Gtk.Viewport;
    }

    set_child(child?: Gtk.Widget | null): void {
        this.#scroll.set_child(child);
    }
}

export namespace ScrolledCarousel {
    export interface ConstructorProps extends Adw.Bin.ConstructorProps {
        scrollAmount: number;
        orientation: Gtk.Orientation.HORIZONTAL;
    }
}
