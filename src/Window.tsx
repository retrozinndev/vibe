import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createRoot } from "gnim";
import { createScopedConnection, createSecureAccessorBinding } from "gnim-utils";
import Home from "./tabs/Home";
import Library from "./tabs/Library";
import Search from "./tabs/Search";
import NavigationTabButton from "./widgets/NavigationTabButton";
import OmniPlayer from "./widgets/OmniPlayer";
import Tab from "./widgets/Tab";
import PluginSelector from "./widgets/PluginSelector";
import { Page as PageWidget } from "./widgets/Page";
import { Pages } from "./pages";
import { Menu } from "./widgets/Menu";
import AboutDialog from "./widgets/AboutDialog";


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
    const tabs: Array<Tab> = [
        new Home(),
        new Search(),
        new Library()
    ];

    pages = <Pages transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN} 
      transitionDuration={400} 
      $={(self) => {
          tabs.forEach(tab => tab.page &&
              self.addStatic(tab.page)
          );
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

                        {tabs.map(tab => 
                            <NavigationTabButton iconName={createBinding(tab, "iconName")}
                              actionClicked={() => {
                                  // all tab pages are already added, so we can do that
                                  pages.set_visible_child_full(
                                      tab.id,
                                      Gtk.StackTransitionType.SLIDE_UP_DOWN
                                  );

                                  pages.lastStaticPage = tab.page;
                              }} 
                              visible={createBinding(tab, "visible")}
                              label={createBinding(tab, "title")}
                              class={createBinding(pages, "currentPage").as(page =>
                                  tab.id === page.id ? "raised" : "flat"
                              )}
                            />
                        )}
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
                        </Adw.HeaderBar>
                        <Adw.ToastOverlay $={self => toastOverlay = self}>
                            <Gtk.Box class={"content"} vexpand>
                                {pages}
                            </Gtk.Box>
                        </Adw.ToastOverlay>
                    </Gtk.Box>
                </Adw.NavigationPage>
            </Adw.NavigationSplitView>
            <Gtk.Separator />
            <OmniPlayer />
        </Gtk.Box> as Gtk.Box
    );
});
