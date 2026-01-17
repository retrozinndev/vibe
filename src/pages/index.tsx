import Gtk from "gi://Gtk?version=4.0";
import GObject, { getter, gtype, property, register, signal } from "gnim/gobject";
import { Page, PagesSignalSignatures, Pages as VibePages } from "libvibe/interfaces";
import { omitObjectKeys } from "../modules/util";


@register({ GTypeName: "VibePagesWidget" })
export class Pages extends Gtk.Stack implements VibePages {
    declare $signals: PagesSignalSignatures;

    #statics: Array<Page> = [];
    #history: Array<Page> = [];
    #currentPage: Page|null = null;

    @getter(gtype<Page>(GObject.Object))
    get currentPage() { return this.#currentPage!; }

    @getter(Array)
    get history() { return this.#history; }

    @getter(Boolean)
    get canGoBack() { return this.#history.length > 0 ? true : Boolean(this.lastStaticPage); }

    // internal properties
    @getter(Array)
    get staticPages() { return this.#statics; }

    @property(gtype<Page|null>(GObject.Object))
    lastStaticPage: Page|null = null;
    // -----

    @signal(gtype<Page>(GObject.Object))
    protected added(page: Page) {
        const name = String(page.id);

        this.add_named(page, name);
        this.set_visible_child_full(name, Gtk.StackTransitionType.SLIDE_LEFT);
        this.notify("can-go-back");
    }

    @signal(gtype<Page>(GObject.Object))
    protected removed(rmPage: Page) {
        const name = String(rmPage.id);

        this.set_visible_child_full(
            String(this.currentPage.id),
            Gtk.StackTransitionType.SLIDE_LEFT_RIGHT
        );

        if(!this.#statics.filter(sp => sp.id === name)[0])
            setTimeout(() => {
                this.remove(this.get_child_by_name(name)!)
            }, this.transitionDuration);
        this.notify("can-go-back");
    }

    constructor(props: {
        initialStaticPage?: Page
    } & Partial<Gtk.Stack.ConstructorProps>) {
        super(omitObjectKeys(props, [ "initialStaticPage" ]));

        props.initialStaticPage &&
            this.addStatic(props.initialStaticPage);
    }

    public add(page: Page): void {
        const previousPage: Page|null = this.currentPage ?? this.lastStaticPage;

        if(previousPage?.id === page.id)
            return;

        for(let i = this.#history.length; i > 0; i--) {
            const p = this.#history[i];

            if(p.id === page.id && i > 0) {
                this.#history.splice(0, i-1).forEach(p => this.emit("removed", p));
                this.notify("history");
                this.#currentPage = page;
                this.notify("current-page");
                return;
            }
        }

        this.#currentPage = page;
        this.notify("current-page");
        this.emit("added", page);

        if(previousPage && !this.#statics.filter(sp => sp.id === previousPage.id)[0]) {
            this.#history.unshift(previousPage);
            this.notify("history");
        }
    }

    /** add a static page(root page) to the stack. 
      * this can be used for pages like home, library, etc. */
    public addStatic(page: Page, name?: string) {
        this.add_named(page, name ?? String(page.id));
        this.#statics.push(page);
        if(!this.#currentPage) {
            this.#currentPage = page;
            this.notify("current-page");
        }

        this.notify("static-pages");
    }

    back(numOfPages: number = 1): void {
        if(this.#history.length < 1 || numOfPages < 1 || numOfPages === 0) 
            return;

        // return to the last static page
        if(this.#history.length === 0 && this.currentPage && this.lastStaticPage) {
            const previousPage = this.currentPage;

            this.#currentPage = this.lastStaticPage;
            this.notify("current-page");
            this.emit("removed", previousPage);
            this.notify("can-go-back");

            return;
        }

        const targetIndex: number = numOfPages - 1;
        const targetPage = this.#history[targetIndex];

        if(!targetPage)
            return;

        this.#currentPage = targetPage;
        this.notify("current-page");
        this.#history.splice(0, targetIndex).forEach(p =>
            this.emit("removed", p)
        );
    }
}
