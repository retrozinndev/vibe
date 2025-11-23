import Gtk from "gi://Gtk?version=4.0"
import { createBinding, For } from "gnim"
import PluginHandler from "../plugins/plugin-handler"
import { Plugin } from "libvibe/plugin"


export default function() {
    return <Gtk.MenuButton class={"flat plugin-selection"}>
        <Gtk.Popover $type="popover">
            <For each={createBinding(PluginHandler.getDefault(), "plugins")}>
                {(plugin: Plugin) => 
                    <Gtk.Button class={"flat"} onClicked={() => {
                        if(PluginHandler.getDefault().plugin.id !== plugin.id)
                            PluginHandler.getDefault().plugin = plugin
                    }}>
                        <Gtk.Box hexpand spacing={6}>
                            <Gtk.Image iconName={"folder-extensions-symbolic"} />
                            <Gtk.Label label={plugin.name} hexpand />
                            <Gtk.Image iconName={"object-select-symbolic"}
                              visible={createBinding(
                                  PluginHandler.getDefault(), "plugin"
                              ).as(p => p.id === plugin.id)}
                            />
                        </Gtk.Box>
                    </Gtk.Button>
                }
            </For>
        </Gtk.Popover>

        <Gtk.Box class={"icons"} spacing={4}>
            <Gtk.Image iconName={"folder-extensions-symbolic"} />
            <Gtk.Image iconName={"pan-down-symbolic"} />
        </Gtk.Box>
    </Gtk.MenuButton>
}
