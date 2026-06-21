import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { getter, gtype, register, setter } from "gnim/gobject";
import { omitObjectKeys } from "../modules/util";
import { Image as VibeImage } from "libvibe/utils";


/** an abstraction made on top of `GtkPicture` to support libvibe `Image` objects.
  * this widget can be styled with the css name `vibeimage` */
@register({ GTypeName: "VibeImageWidget" })
export class Image extends Gtk.Picture {
    declare readonly $signals: Image.SignalSignatures;
    declare readonly $readWriteProperties: Image.ReadWriteProperties;

    #image: VibeImage|null = null;

    /** a libvibe `Image` object, containing the image's source */
    @getter(gtype<VibeImage|null>(GObject.Object))
    get image() { return this.#image; }

    @setter(gtype<VibeImage|null>(GObject.Object))
    set image(newImage: VibeImage|null) {
        this.#image = newImage;
        this.notify("image");

        this.setupImage();
    }

    constructor(props: Partial<GObject.ConstructorProps<Image>>) {
        super({
            cssName: "vibeimage",
            ...omitObjectKeys(props, [
                "image"
            ])
        });

        if(props.image !== undefined) {
            this.#image = props.image;
            this.setupImage();
        }

        this.image?.ref();
        const id = (this as Image).connect("destroy", () => {
            this.disconnect(id);
            this.image?.unref();
        });
    }

    setupImage(): void {
        if(!this.image) {
            if(this.get_paintable())
                this.set_paintable(null); // unset picture if image is null

            return;
        }

        const texture = this.image.texture;
        if(!texture) {
            if(this.get_paintable()) {
                this.set_paintable(texture);
                return;
            }

            if(this.image.source)
                this.image.load().then(() => this.setupImage()); // load image back into memory from its source

            return;
        }

        this.set_paintable(texture);
    }
}

export namespace Image {
    export interface ReadWriteProperties extends Gtk.Picture.ReadWriteProperties {
        image: VibeImage;
    }

    export interface SignalSignatures extends Gtk.Picture.SignalSignatures {
        "notify::image": () => void;
    }
}
