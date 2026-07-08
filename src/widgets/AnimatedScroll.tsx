import Gtk from "gi://Gtk?version=4.0";
import { register, property } from "gnim/gobject";
import GObject from "gi://GObject?version=2.0";
import { omitObjectKeys } from "../modules/util";
import { DragScroll } from "./DragScroll";
import Animation from "../modules/animation";


/** adds animated scrolling methods to GtkScrolledWindow */
@register({ GTypeName: "VibeAnimatedScroll" })
export class AnimatedScroll extends DragScroll {
    declare readonly $readWriteProperties: AnimatedScroll.ReadWriteProperties;

    #hAnim: Animation|null = null;
    #vAnim: Animation|null = null;
    
    /** animation duration in millis. @default `400` */
    @property(Number)
    duration: number = 400;


    constructor(props: Partial<GObject.ConstructorProps<AnimatedScroll>>) {
        super({
            hscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
            vscrollbarPolicy: Gtk.PolicyType.EXTERNAL,
            ...omitObjectKeys(props, ["duration"])
        });

        if(props.duration != null)
            this.duration = props.duration;
    }

    /** stop animation (if no `anim`, stop everything) */
    protected stopAnimation(anim?: Animation): void {
        if(anim == null) {
            this.#hAnim?.stop();
            this.#vAnim?.stop();
            this.#hAnim &&= null;
            this.#vAnim &&= null;

            return;
        }

        anim.stop();
    }


    scroll(x?: number, y?: number): void {
        if(x != null) {
            this.#hAnim != null &&
                this.stopAnimation(this.#hAnim);

            const min = this.get_hadjustment().get_lower(),
                max = this.get_hadjustment().get_upper();

            if(x < min)
                x = 0;
            else if(x > max)
                x = max;

            this.#hAnim = new Animation({
                widget: this,
                duration: this.duration,
                get: () => this.get_hadjustment()!.get_value(),
                set: (v) => this.get_hadjustment()!.set_value(v)
            });
            this.#hAnim.start(x!, () => this.#hAnim = null);
        }

        if(y != null) {
            this.#vAnim != null &&
                this.stopAnimation(this.#vAnim);

            const min = this.get_vadjustment().get_lower(),
                max = this.get_vadjustment().get_upper();

            if(y < min)
                y = min;
            else if(y > max)
                y = max;

            this.#vAnim = new Animation({
                widget: this,
                duration: this.duration,
                get: () => this.get_vadjustment()!.get_value(),
                set: (v) => this.get_vadjustment()!.set_value(v)
            });
            this.#vAnim.start(y!, () => this.#vAnim = null);
        }
    }
}

export namespace AnimatedScroll {
    export interface ReadWriteProperties extends Gtk.ScrolledWindow.ReadWriteProperties {
        "duration": number;
    }
}
