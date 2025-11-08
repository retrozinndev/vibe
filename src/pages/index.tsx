import GObject, { getter, gtype, register, signal } from "gnim/gobject";
import { Page, PagesSignalSignatures, Pages as VibePages } from "libvibe/interfaces";
import Gtk from "gi://Gtk?version=4.0";
import { omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibePagesWidget" })
export class Pages extends Gtk.Stack implements VibePages {
    declare $signals: PagesSignalSignatures;

    #history: Array<Page> = [];
    #page: Page;

    @getter(gtype<Page>(GObject.Object))
    get page() { return this.#page; }


    @signal(gtype<Page>(GObject.Object))
    pageAdded(_: Page) {}

    @signal(gtype<Page>(GObject.Object))
    pageRemoved(_: Page) {}


    constructor(props: {
        initialPage: Page
    } & Partial<Gtk.Stack.ConstructorProps>) {
        super(omitObjectKeys(props, [ "initialPage" ]));

        this.#page = props.initialPage;
    }

    public addPage(page: Page): void {
        
    }

    back(): void {
        
    }
}
