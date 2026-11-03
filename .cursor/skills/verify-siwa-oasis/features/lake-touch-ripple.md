# Salt lake ripple

## Sub-features

On the salt lakes chapter, tapping the lake spawns ripples; the dock band is guarded against stray ripples.

## How to get to it (user POV)

From the opened site. No sign-in, no setup.

## Driving it with the cloud browser

Follow the Drive rules in ../SKILL.md: wake the chrome with a real pointerdown
immediately before each click, use refs from read-page, settle 20-25s, verify
at desktop and 390px phone.

## Gotchas

- Mid-lerp captures read as rendering bugs; settle first.
- The first tap after 4.2s of idle only wakes chrome; it does not reach the scene.
