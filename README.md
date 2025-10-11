# 🎵 Vibe
In-development Music Player made with Adwaita. <br>
The name is a [recursive acronym](https://en.wikipedia.org/wiki/Recursive_acronym): *Vibe* *i*s *b*ased on *e*xtensions.

> [!warning]
> This is still in development and doesn't work yet!

## Goals
- Play(and maybe stream from tcp/udp) music
- Implement MPRIS
- Use TypeScript and [Gnim](https://github.com/aylur/gnim) with GJS
- Internationalization (i18n)
- Pretty attractive but familiar interface
- Plugin support (for adding new sources and features...)

## :hammer_and_wrench: Development
This will guide you on how to develop for the Vibe Music Player.

To learn how to use build modifiers, most of the commands provide 
a help message that you can trigger with `-h`.

### Cloning the repo
You can run:
```zsh
git clone https://github.com/retrozinndev/vibe.git
```
or, if you have GitHub CLI:
```zsh
gh repo clone retrozinndev/vibe
```

### Build types (needed)
You need to build types before starting to develop: this will let TypeScript know which 
libraries from the [GI Repository(GIR)](https://gi.readthedocs.io/en/latest) are available to be used in the project,
and also integrating autocompletion, thanks to [gjsify/ts-for-gir](https://github.com/gjsify/ts-for-gir).

You can do so by running
```zsh
pnpm types
```
After that, you probably won't need to do this again. 
But it's good to keep them updated, so you'll know when a library has updated.

### Build
To build the app, you can use
```zsh
pnpm build
```

But if you want a development build(and a faster way to test), use
```zsh
pnpm dev
```
which will build the app and run it right away(replaces the currently-running instance).

### Start
Although it's recommended to use `pnpm dev` to test builds, you can also run by using 
```zsh
pnpm start
```
which will only start the app build(won't build the app again)


### Production
To build a release version of the app, you can run 
```zsh
pnpm build:release
```
or the simplified command
```zsh
pnpm release
```

### Clean
You can clean the default build directory by running
```zsh
pnpm clean
```
