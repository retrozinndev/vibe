import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createRoot, For } from "gnim";
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


let pages: Pages, toastOverlay: Adw.ToastOverlay;

export function getPages(): Pages {
    return pages;
}

export function getToastOverlay(): Adw.ToastOverlay {
    return toastOverlay;
}

export const createMainWindow = (app: Adw.Application) => 
    <Adw.ApplicationWindow title={"Vibe"} hideOnClose={false} visible 
      application={app} class={DEVEL ? "devel" : ""} 
    /> as Adw.ApplicationWindow;

export const start = (mainWindow: Adw.ApplicationWindow) => createRoot((dispose) => {
    pages = <Pages transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN} 
      transitionDuration={400} 
      $={(self) => {
          [
            new Home(),
            new Search(),
            new Library()
          ].forEach(page => self.addStatic(page))
      }}
    /> as Pages;

    createScopedConnection(mainWindow, "close-request", () => dispose());

    mainWindow.set_content(
        <Gtk.Box class={"container"} orientation={Gtk.Orientation.VERTICAL}>
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

                        <For each={createBinding(pages, "staticPages") as Accessor<Array<Page>>}>
                            {(page: Page) =>
                                <NavigationTabButton iconName={createBinding(page, "iconName") as Accessor<string>}
                                  actionClicked={() => {
                                      // all tab pages are already added, so we can do that
                                      pages.set_visible_child_full(
                                          String(page.id),
                                          Gtk.StackTransitionType.CROSSFADE
                                      );

                                      pages.lastStaticPage = page;
                                  }} 
                                  visible={createBinding(page, "visible")}
                                  label={createBinding(page, "tabName")}
                                  class={createBinding(pages, "currentPage").as(p =>
                                      page.id === p.id ? "raised" : "flat"
                                  )}
                                />
                            }
                        </For>
                    </Gtk.Box>
                </Adw.NavigationPage>

                {/* page */}
                <Adw.NavigationPage title={createSecureAccessorBinding<PageWidget>(
                    createBinding(pages, "visibleChild") as Accessor<PageWidget>, "title", ""
                )} name={"navpage"}>
                    <Gtk.Box class={"container"} vexpand={false} orientation={Gtk.Orientation.VERTICAL}>
                        <Adw.HeaderBar class={"flat"}>
                            <Gtk.Button iconName={"go-previous-symbolic"} $type="start" 
                              visible={createBinding(pages, "canGoBack")}
                              onClicked={() => pages.back()}
                            />
                            <Gtk.Button iconName={"view-refresh-symbolic"} $type="end"
                              onClicked={() => pages.currentPage?.emit("refresh")}
                            />
                        </Adw.HeaderBar>
                        <Adw.ToastOverlay $={self => toastOverlay = self}>
                            {pages}
                        </Adw.ToastOverlay>
                    </Gtk.Box>
                </Adw.NavigationPage>
            </Adw.NavigationSplitView>
            <Gtk.Separator />
            <OmniPlayer />
        </Gtk.Box> as Gtk.Box
    );
});
