import Gtk from "gi://Gtk?version=4.0";
import GObject, { getter, gtype, property, register, signal } from "gnim/gobject";
import { Page, Pages as VibePages } from "libvibe/interfaces";
import { Page as PageWidget } from "../widgets/Page";


@register({ GTypeName: "VibePagesWidget" })
export class Pages extends Gtk.Stack implements VibePages {
    declare $signals: VibePages.SignalSignatures;

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
        this.notify("can-go-back");
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

        this.notify("can-go-back");
    }


    constructor(props: Partial<Gtk.Stack.ConstructorProps>) {
        super({
            cssName: "pages",
            ...props
        });

        this.#connections.push(
            this.connect("notify::visible-child", () => {
                const child = this.get_visible_child() as Gtk.StackPage|null;

                this.#currentPage = child as Page|null;
                this.notify("current-page");

                const isCurrentPageStatic = this.#currentPage && 
                    Boolean(this.#statics.find(p => p.id === this.#currentPage!.id));

                if(isCurrentPageStatic)
                    this.#history.splice(0, this.#history.length).forEach(p => this.remove(p));

                this.notify("can-go-back");
            }),
            this.connect("destroy", () => this.#connections.forEach(id =>
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
                this.notify("current-page");

                // remove pages that came after the previously-added page
                this.#history.splice(i, this.#history.length).forEach(p => 
                    this.remove(p)
                );
                this.notify("history");
                this.notify("can-go-back");
                console.log(this.#history.map(p => p.id))
                return;
            }
        }

        if(this.#currentPage && !this.isStatic(this.#currentPage)) {
            this.#history.push(this.#currentPage);
            this.notify("history");
            this.notify("can-go-back");
        }

        this.#currentPage = page as Page;
        this.notify("current-page");
        this.emit("added", page);
    }

    /** @returns true if the provided `page` is a static page */
    public isStatic<T extends Page.Type>(page: Page<T>): boolean {
        return Boolean(this.#statics.find(p => p.id === page.id));
    }

    /** add a static page(root page) to the stack. 
      * this is used for pages like home, library, etc. */
    public addStatic(page: Page, name?: string) {
        this.add_named(page, name ?? String(page.id));
        this.#statics.push(page);
        if(!this.#currentPage) {
            this.#currentPage = page;
            this.notify("current-page");
            this.lastStaticPage = page;
        }

        this.notify("static-pages");
    }

    remove(child: Gtk.Widget): void {
        if(child instanceof PageWidget) 
            this.emit("removed", child);

        super.remove(child);
    }

    // TODO: support going back a specific number of pages in the history
    back(numOfPages: number = 1): void {
        if(this.#history.length < 1 || this.isStatic(this.#currentPage!)) {
            this.set_visible_child_full(
                String(this.lastStaticPage!.id),
                Gtk.StackTransitionType.SLIDE_LEFT_RIGHT
            );
            return;
        }

        const removed = this.#history.splice(this.#history.length-1, 1)[0] ?? this.#currentPage;
        this.notify("history");
        this.notify("can-go-back");

        this.#currentPage = this.#history[this.#history.length-1] ?? this.lastStaticPage;
        this.notify("current-page");
        this.remove(removed);
    }
}
