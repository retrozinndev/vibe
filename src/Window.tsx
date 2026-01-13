import Adw from "gi://Adw?version=1";
import Gtk from "gi://Gtk?version=4.0";
import { Accessor, createBinding, createRoot } from "gnim";
import { createScopedConnection, createSecureAccessorBinding } from "gnim-utils";
import { App } from "./app";
import Home from "./tabs/Home";
import Library from "./tabs/Library";
import Search from "./tabs/Search";
import NavigationTabButton from "./widgets/NavigationTabButton";
import OmniPlayer from "./widgets/OmniPlayer";
import Tab from "./widgets/Tab";
import PluginSelector from "./widgets/PluginSelector";
import { Page as PageWidget } from "./widgets/Page";
import { Pages } from "./pages";


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
                            <Gtk.MenuButton class={"more flat"} iconName={"open-menu-symbolic"}
                              $type="start">

                                <Gtk.Popover $type="popover" $={popover => {
                                    popover.set_child(
                                        <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
                                            <Gtk.Button class={"flat"} label={"Settings"} />
                                            <Gtk.Button class={"flat"} label={"About"} onClicked={(self) => {
                                                const dialog = Adw.AboutDialog.new();
                                                dialog.set_application_name("Vibe");
                                                dialog.set_application_icon("folder-music-symbolic");
                                                dialog.set_version(App.get_default().version);
                                                dialog.set_license(App.get_default().license);
                                                dialog.set_developer_name("retrozinndev");
                                                dialog.set_developers(["João Dias"]);
                                                dialog.set_website("https://github.com/retrozinndev/vibe");
                                                dialog.present(self.root);

                                                popover.popdown();
                                            }} />
                                        </Gtk.Box> as Gtk.Box
                                    );
                                }} />
                            </Gtk.MenuButton>
                            <Gtk.Label class="heading" label="Vibe" $type="title" />
                            <PluginSelector $type="end" />
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
