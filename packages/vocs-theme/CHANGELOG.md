# @cartesi/vocs-theme

## 0.1.0-alpha.0

### Minor Changes

- aab9574: Initial release: Cartesi branding for Vocs v2 documentation sites, built on `@cartesi/brand`.
  
  `cartesiTheme()` returns the site config keys to spread into `defineConfig`: the brand accent, the logo and favicon, and the Cartesi social links. `@cartesi/vocs-theme/styles.css`, imported from the site's `_root.css`, puts the brand colours and typefaces on Vocs' theme, and `Footer` and `OutlineFooter` from `@cartesi/vocs-theme/slots` add a branded footer and a pointer to the Cartesi Discord.
  
  Requires vocs 2.11 or later and React 19.

### Patch Changes

- Updated dependencies [aab9574]
  - @cartesi/brand@0.1.0-alpha.0
