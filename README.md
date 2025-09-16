# 🎵 Vibe
In-development Music Player made with Adwaita.

> [!warning]
> This is still in development and doesn't work yet!

## Goals
- Play(and maybe stream) music
- Work with MPRIS Interface
- Use TypeScript and [Gnim](https://github.com/aylur/gnim) with GJS
- Internationalization (i18n)
- Pretty attractive but familiar interface
- Plugin support (for adding new sources and more...)

# :hammer_and_wrench: Development
This will guide you on how to develop for the Vibe Music Player.

To learn how to use build modifiers, most of the commands provide 
a help message that you can trigger with `-h`.

# Build
To build the app, you can use
```zsh
pnpm build
```

But if you want a development build(and a faster way to test), use
```zsh
pnpm dev
```
which will build the app and run it right away(replaces the curretly-running instance).

# Production
To build a release version of the app, you can run 
```zsh
pnpm build:release
```
or the simplified command
```zsh
pnpm release
```
