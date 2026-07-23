import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { getter, gtype, property, register, signal } from "gnim/gobject";
import { Page as VibePage, Pages as VibePages } from "libvibe/interfaces";
import { Page } from "../widgets/Page";
import { VibeObject } from "libvibe/objects";


@register({ GTypeName: "VibePagesWidget" })
export class Pages extends Gtk.Stack implements VibePages {
    declare readonly $signals: VibePages.SignalSignatures;
    declare readonly $readableProperties: VibePages.ReadableProperties;
    declare readonly $readWriteProperties: VibePages.ReadWriteProperties;

    #connections: Array<number> = [];
    #statics: Array<Page> = [];
    #history: Array<Page> = [];
    #currentPage: Page|null = null;

    
    @signal(gtype<Page>(GObject.Object))
    protected added(page: Page) {
        const name = String(page.id);

        this.add_named(page, name);
        this.set_visible_child_full(name, Gtk.StackTransitionType.SLIDE_LEFT);
    }

    @signal(gtype<Page>(GObject.Object))
    protected removed(page: Page) {
        this.set_visible_child_full(
            String(this.currentPage.id),
            Gtk.StackTransitionType.SLIDE_LEFT_RIGHT
        );
        this.remove(page);
    }

    @getter(gtype<Page>(GObject.Object))
    get currentPage() { return this.#currentPage!; }

    @getter(Array)
    get history() { return this.#history; }

    @getter(Boolean)
    get canGoBack() { return this.#history.length > 0; }

    @getter(Array<Page>)
    get staticPages() { return this.#statics; }

    @property(gtype<Page|null>(GObject.Object))
    lastStaticPage: Page|null = null;


    constructor(props: Partial<GObject.ConstructorProps<Pages>>) {
        super({
            cssName: "pages",
            ...props
        });

        this.#connections.push(
            (this as Pages).connect("notify::visible-child", () => {
                const child = this.get_visible_child() as Page|null;

                this.#currentPage = child;
                (this as Pages).notify("current-page");

                if(child instanceof Page && this.isStatic(child))
                    this.lastStaticPage = child;
            }),
            (this as Pages).connect("destroy", () => this.#connections.forEach(id =>
                this.disconnect(id)
            ))
        );
    }

    public add<T extends VibePage.Type>(page: Page<T>): void {
        if(this.#currentPage?.id === page.id)
            return;

        const matchingIndex = this.#history.findIndex(p => p.id === page.id);
        if(matchingIndex > -1) {
            this.back(this.#history.length - matchingIndex);
            return;
        }

        this._add(page);
    }

    /** actually adds the page. you might want to do some checks before running this */
    protected _add(page: Page<any>): void {

        this.#currentPage = page;
        (this as Pages).notify("current-page");
        this.#history.push(this.#currentPage);
        (this as Pages).notify("history");

        if(this.#currentPage.content instanceof VibeObject && this.#currentPage.content.plugin)
            this.#currentPage.content.plugin.emit("page-request", this.#currentPage);

        (this as Pages).emit("added", page);
        this.notify("can-go-back");
    }

    /** @returns true if the provided `page` is a static page */
    public isStatic<T extends VibePage.Type>(page: Page<T>): boolean {
        return Boolean(this.#statics.find(p => p.id === page.id));
    }

    /** add a static page to the stack; "static" here stands for persistent. 
      * this is used for pages like home, library and search. */
    public addStatic(page: Page, name?: string) {
        this.add_named(page, name ?? String(page.id));
        this.#statics.push(page);

        if(!this.#currentPage) {
            this.#currentPage = page;
            (this as Pages).notify("current-page");
        }

        (this as Pages).notify("static-pages");
    }

    back(num: number = 1): void {
        if(num < 1 || this.#history.length < 1)
            return;

        if(num > this.#history.length)
            num = this.#history.length;

        const diff = (this.#history.length-num);
        const pages = this.#history.splice(diff < 0 ? 0 : diff, num);
        /** page that will be presented after going back */
        const targetPage = this.#history.at(-1) ?? this.lastStaticPage ?? this.#statics[0];

        this.#currentPage = targetPage;
        (this as Pages).notify("current-page");
        (this as Pages).notify("history");

        for(const page of pages) {
            (this as Pages).emit("removed", page);
        }

        (this as Pages).notify("can-go-back");
    }
}
