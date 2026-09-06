# 🎵 Vibe
In-development Music Player made with Adwaita. <br>
The name is a [recursive acronym](https://en.wikipedia.org/wiki/Recursive_acronym): *Vibe* *i*s *b*ased on *e*xtensions.

> [!warning]
> This is still in development and doesn't work yet!

## State
This is only a demonstration, some UI elements might not work as intended.
![App demo screenshot](/repo/demo.png)


## Goals
- [x] Play music locally
- [x] Adwaita-based UI, but keeping it familiar to other apps
- [x] Plugin support (for adding new sources and features...)
- [x] Implement MPRIS
- [ ] Internationalization (i18n)

See the public [Project](https://github.com/users/retrozinndev/projects/5) for more in-depth progress.

## :hammer_and_wrench: Development
This will guide you on how to develop for the Vibe Music Player.

To learn how to use build modifiers, most of the commands provide 
a help message that you can trigger with `-h`.
By the way, this project uses `bun` for project/dependency management,
which is a faster alternative to node and pnpm/npm.

### Cloning the repo
You can run:
```zsh
git clone https://github.com/retrozinndev/vibe.git --recurse-submodules
```
or, if you have GitHub CLI:
```zsh
gh repo clone retrozinndev/vibe --recurse-submodules
```

### Build types
You need to build types before starting to develop: this will let TypeScript know which 
libraries from [GIR](https://gi.readthedocs.io/en/latest) are available to be used in the project,
and also adding support for autocompletion, thanks to [aylur/girgen](https://github.com/aylur/girgen).

You can do so by running
```zsh
bun types
```
After that, you probably won't need to do this again. 
But it's good to keep them updated, so you'll know when a library has updated.

### Build
To build the app, you can use
```zsh
bun run build
```

But if you want a development build(and a faster way to test), use
```zsh
bun dev
```
which will build the app and run it right away(replaces the currently-running instance).

### Start
Although it's recommended to use `bun dev` to test builds, you can also run by using 
```zsh
bun start
```
which will start the current build, without building the app again.


### Production
To build a release version of the app, you can run 
```zsh
bun build:release
```
or the simplified command
```zsh
bun release
```

### Clean
You can clean the default build directory by running
```zsh
bun clean
```
