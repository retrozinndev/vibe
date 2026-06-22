import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createRoot, For, getScope, type Scope } from "gnim";
import { register } from "gnim/gobject";
import { createScopedConnection, createSecureAccessorBinding } from "gnim-utils";
import NavigationTabButton from "./widgets/NavigationTabButton";
import OmniPlayer from "./widgets/OmniPlayer";
import PluginSelector from "./widgets/PluginSelector";
import { Page, Page as PageWidget } from "./widgets/Page";
import { Pages } from "./pages";
import { Menu } from "./widgets/Menu";
import AboutDialog from "./widgets/AboutDialog";
import { Home } from "./pages/Home";
import { Search } from "./pages/Search";
import { Library } from "./pages/Library";
import GObject from "gi://GObject?version=2.0";
import { App } from "./app";


@register({ GTypeName: "VibeMainWindow" })
export default class Window extends Adw.ApplicationWindow {
    protected static instance: Window;
    protected static pagesList: Array<new () => Page> = [
        Home,
        Search,
        Library
    ];

    #overlay!: Adw.ToastOverlay;
    #pageStack!: Pages;
    #scope: Scope;

    constructor(props?: Partial<GObject.ConstructorProps<Window>>) {
        super({
            title: "Vibe",
            hideOnClose: false,
            visible: true,
            ...(props ?? {})
        });

        if(DEVEL)
            this.add_css_class("devel");

        this.#scope = getScope();
        createScopedConnection((this as Window), "close-request", () => {
            this.#scope.dispose();
            return true;
        });
    }

    public init(): void {
        if(this.#overlay)
            return;

        this.#overlay = Adw.ToastOverlay.new();
        this.#pageStack = new Pages({
            transitionDuration: 400,
            transitionType: Gtk.StackTransitionType.SLIDE_UP_DOWN,
        });

        for(const Page of Window.pagesList)
            this.#pageStack.addStatic(new Page());


        this.#overlay.set_child(this.#pageStack);
        this.set_content(
            <Gtk.Box class={"container background"} orientation={Gtk.Orientation.VERTICAL}>
                <Adw.NavigationSplitView vexpand sidebarPosition={Gtk.PackType.START}>
                    {/* sidebar */}
                    <Adw.NavigationPage title={"Sidebar"} $type="sidebar">
                        <Gtk.Box orientation={Gtk.Orientation.VERTICAL} vexpand={false} spacing={6}
                          class={"sidebar-container"}>

                            <Adw.HeaderBar class={"flat"}>
                                <PluginSelector $type="start" />
                                <Gtk.Label class="heading" label="Vibe" $type="title" />
                                <Gtk.MenuButton class={"more flat"} iconName={"open-menu-symbolic"}
                                  $type="end">

                                    <Menu $type="popover" buttons={[
                                        {
                                            label: "Settings"
                                        }, {
                                            label: "About",
                                            onClicked: AboutDialog
                                        }
                                    ]} />
                                </Gtk.MenuButton>
                            </Adw.HeaderBar>

                            <For each={createBinding(this.#pageStack, "staticPages") as Accessor<Array<Page>>}>
                                {(page: Page) =>
                                    <NavigationTabButton iconName={createBinding(page, "iconName") as Accessor<string>}
                                      actionClicked={() => {
                                          // all tab pages are already added, so we can do that
                                          this.#pageStack.set_visible_child_full(
                                              String(page.id),
                                              Gtk.StackTransitionType.CROSSFADE
                                          );

                                          this.#pageStack.lastStaticPage = page;
                                      }} 
                                      visible={createBinding(page, "visible")}
                                      label={createBinding(page, "tabName")}
                                      class={createBinding(this.#pageStack, "currentPage").as(p =>
                                          page.id === p.id ? "raised" : "flat"
                                      )}
                                    />
                                }
                            </For>
                        </Gtk.Box>
                    </Adw.NavigationPage>

                    {/* page */}
                    <Adw.NavigationPage title={createSecureAccessorBinding<PageWidget>(
                        createBinding(this.#pageStack, "visibleChild") as Accessor<PageWidget>, "title", ""
                    )} name={"navpage"}>
                        <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                            <Adw.HeaderBar class={"flat"}>
                                <Gtk.Button iconName={"go-previous-symbolic"} $type="start" 
                                  visible={createBinding(this.#pageStack, "canGoBack")}
                                  onClicked={() => this.#pageStack.back()}
                                />
                                <Gtk.Button iconName={"view-refresh-symbolic"} $type="end"
                                  onClicked={() => this.#pageStack.currentPage?.emit("refresh")}
                                />
                            </Adw.HeaderBar>
                            {this.#overlay}
                        </Gtk.Box>
                    </Adw.NavigationPage>
                </Adw.NavigationSplitView>
                <Gtk.Separator />
                <OmniPlayer />
            </Gtk.Box> as Gtk.Box
        );
    }

    public static getDefault(app?: Adw.Application): Window {
        return this.instance ??= createRoot(() =>
            new this({ application: app ?? App.get_default() })
        );
    }

    public getPages(): Pages {
        return this.#pageStack;
    }

    public getToastOverlay(): Adw.ToastOverlay {
        return this.#overlay;
    }
}
