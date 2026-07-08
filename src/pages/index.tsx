import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import { getter, gtype, property, register, signal } from "gnim/gobject";
import { Page, Pages as VibePages } from "libvibe/interfaces";
import { Page as PageWidget } from "../widgets/Page";
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

    @getter(gtype<Page>(GObject.Object))
    get currentPage() { return this.#currentPage!; }

    @getter(Array)
    get history() { return this.#history; }

    @getter(Boolean)
    get canGoBack() { return this.#history.length > 0 || (this.#currentPage && !this.isStatic(this.currentPage) || false); }

    // internal properties
    @getter(Array<Page>)
    get staticPages() { return this.#statics; }

    @property(gtype<Page|null>(GObject.Object))
    lastStaticPage: Page|null = null;
    // -----

    @signal(gtype<Page>(GObject.Object))
    protected added(page: Page) {
        const name = String(page.id);

        this.lastStaticPage ??= this.#currentPage && this.isStatic(this.#currentPage) ?
            this.#currentPage
        : this.#statics[0];
        this.add_named(page, name);
        this.set_visible_child_full(name, Gtk.StackTransitionType.SLIDE_LEFT);
        (this as Pages).notify("can-go-back");
    }

    @signal(gtype<Page>(GObject.Object))
    protected removed(_: Page) {
        this.lastStaticPage ??= this.#currentPage && this.isStatic(this.#currentPage) ?
            this.#currentPage
        : this.#statics[0];

        this.set_visible_child_full(
            String(this.currentPage.id),
            Gtk.StackTransitionType.SLIDE_LEFT_RIGHT
        );

        (this as Pages).notify("can-go-back");
    }


    constructor(props: Partial<GObject.ConstructorProps<Pages>>) {
        super({
            cssName: "pages",
            ...props
        });

        this.#connections.push(
            (this as Pages).connect("notify::visible-child", () => {
                const child = this.get_visible_child() as Gtk.StackPage|null;

                this.#currentPage = child as Page|null;
                (this as Pages).notify("current-page");

                const isCurrentPageStatic = this.#currentPage && 
                    Boolean(this.#statics.find(p => p.id === this.#currentPage!.id));

                if(isCurrentPageStatic)
                    this.#history.splice(0, this.#history.length).forEach(p => this.remove(p));

                (this as Pages).notify("can-go-back");
            }),
            (this as Pages).connect("destroy", () => this.#connections.forEach(id =>
                this.disconnect(id)
            ))
        );
    }

    public add<T extends Page.Type>(page: Page<T>): void {
        if(this.#currentPage?.id === page.id)
            return;

        for(let i = 0; i > this.#history.length; i++) {
            const p = this.#history[i];

            if(p.id === page.id) {
                this.#currentPage = page as Page;
                this.set_visible_child_name(String(this.#currentPage.id));
                (this as Pages).notify("current-page");

                // remove pages that came after the previously-added page
                this.#history.splice(i, this.#history.length).forEach(p => 
                    this.remove(p)
                );
                (this as Pages).notify("history");
                (this as Pages).notify("can-go-back");
                console.log(this.#history.map(p => p.id))
                return;
            }
        }

        if(this.#currentPage && !this.isStatic(this.#currentPage)) {
            this.#history.push(this.#currentPage);
            (this as Pages).notify("history");
            (this as Pages).notify("can-go-back");
        }

        this.#currentPage = page as Page;
        (this as Pages).notify("current-page");

        if(this.#currentPage.content instanceof VibeObject && this.#currentPage.content.plugin)
            this.#currentPage.content.plugin.emit("page-request", this.#currentPage);

        (this as Pages).emit("added", page);
    }

    /** @returns true if the provided `page` is a static page */
    public isStatic<T extends Page.Type>(page: Page<T>): boolean {
        return Boolean(this.#statics.find(p => p.id === page.id));
    }

    /** add a root page to the stack; "root" here stands for persistent. 
      * this is used for pages like home, library, etc. */
    public addStatic(page: Page, name?: string) {

        this.add_named(page, name ?? String(page.id));
        this.#statics.push(page);
        if(!this.#currentPage) {
            this.#currentPage = page;
            (this as Pages).notify("current-page");
            this.lastStaticPage = page;
        }

        (this as Pages).notify("static-pages");
    }

    remove(child: Gtk.Widget): void {
        if(child instanceof PageWidget) 
            (this as Pages).emit("removed", child);

        super.remove(child);
    }

    back(num: number = 1): void {

        if(this.#history.length < 1){
            this.set_visible_child_full(
                String(this.lastStaticPage!.id),
                Gtk.StackTransitionType.SLIDE_LEFT_RIGHT
            );
            return;
        }

        const removed = this.#history.splice(this.#history.length-1, 1)[0] ?? this.#currentPage;
        (this as Pages).notify("history");
        (this as Pages).notify("can-go-back");

        this.#currentPage = this.#history[this.#history.length-1] ?? this.lastStaticPage;
        (this as Pages).notify("current-page");
        this.remove(removed);
    }
}
