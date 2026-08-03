# Changelog

## Unreleased

### Added

* subscribe the open map to live invalidations for only its selected server
* apply claim, player, GPS marker, and marketplace offer deltas without REST reloads

### Fixed

* back off reconnects until the map subscription is confirmed
* use periodic REST player refresh only while live updates are unavailable

## [1.3.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.2.0...rw-manager-v1.3.0) (2026-07-28)


### Added

* player list page ([52ef5be](https://github.com/Devidian/devidian-rw-manager/commit/52ef5be87d38e35176ed9c9d7576a92c50954f20))


### Build

* **deps-dev:** bump the npm_and_yarn group across 1 directory with 3 updates ([96a5dcc](https://github.com/Devidian/devidian-rw-manager/commit/96a5dcc57138b6fc7c4875df1abff41e8ebe9988))
* **deps-dev:** bump the npm_and_yarn group across 1 directory with 3 updates ([181a0a0](https://github.com/Devidian/devidian-rw-manager/commit/181a0a0c4049e7dc4a14c5d440ab9ca1511b27bb))
* **deps:** bump body-parser ([ea26b66](https://github.com/Devidian/devidian-rw-manager/commit/ea26b666e514e9bbdb497301bea2de7e64bd5519))
* **deps:** bump body-parser from 2.2.2 to 2.3.0 in the npm_and_yarn group across 1 directory ([dd0cfe1](https://github.com/Devidian/devidian-rw-manager/commit/dd0cfe1d445b918df8206286f8b276c5b0fad3b2))


### Maintenance

* add codex custom agents ([63c6b07](https://github.com/Devidian/devidian-rw-manager/commit/63c6b07baa9318178ada538fa6d2400630750ebd))

## [1.2.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.1.0...rw-manager-v1.2.0) (2026-07-06)


### Added

* add global intercom frontend chat ([0062b5c](https://github.com/Devidian/devidian-rw-manager/commit/0062b5ca5419b845ff2db8bb322a5db429d8bcae))
* add GPS map marker layer ([c2429f1](https://github.com/Devidian/devidian-rw-manager/commit/c2429f17da4dba39bc4990844168fc2155dda280))
* add online map layers ([6b19bf7](https://github.com/Devidian/devidian-rw-manager/commit/6b19bf7ac694889eb9685cf372c0c4bbb6f6c8fc))
* added node server for deployment, env for subpath support ([fe83902](https://github.com/Devidian/devidian-rw-manager/commit/fe839029d2a6649b12cf4df0b89777dc57772e5a))
* plugin list & map (WIP) ([409d06a](https://github.com/Devidian/devidian-rw-manager/commit/409d06a61283c0167592968aa94217277751eee0))
* release manager map UI updates ([4f7e77f](https://github.com/Devidian/devidian-rw-manager/commit/4f7e77fa678459a09c88d5fccf634f66a57b31fa))


### Fixed

* allow panning beyond generated map tiles ([bdf9d6b](https://github.com/Devidian/devidian-rw-manager/commit/bdf9d6bbb47420ac54125613bf6dfec2f4c66664))
* auth headers, express placeholders env, pre in p not allowed ([238f605](https://github.com/Devidian/devidian-rw-manager/commit/238f6056796a471ce166ea9c11c7aa89ffd915a4))
* header image uri typo ([6b492ac](https://github.com/Devidian/devidian-rw-manager/commit/6b492acc703e9a4f87a6896c5dce5dd64fc628d1))
* inject global intercom websocket env ([6c34750](https://github.com/Devidian/devidian-rw-manager/commit/6c34750c8b220bac8fd3e6c336cc6be1bfe2513d))
* pre text in server-info description ([790d18a](https://github.com/Devidian/devidian-rw-manager/commit/790d18a722e93f7bc11d8ed16ecd7fdd8ce4677c))
* refine intercom chat and map fullscreen ([8c2956c](https://github.com/Devidian/devidian-rw-manager/commit/8c2956c036b3f5eb11ff699c653c50907fa0e9e4))
* remove unmerged code ([244f0c9](https://github.com/Devidian/devidian-rw-manager/commit/244f0c9630799b77f0725aca5d0ca2038356dc96))
* render intercom screenshot attachments ([41f945c](https://github.com/Devidian/devidian-rw-manager/commit/41f945c35cb59b081dc728c4f98e35af75c49b41))
* render intercom source colors ([f57f169](https://github.com/Devidian/devidian-rw-manager/commit/f57f1699c01d9fcbedc06516a2cfd7cf4369a935))
* richtext in server config ([63412ad](https://github.com/Devidian/devidian-rw-manager/commit/63412ad3f008e4434fcd7235feb388f3cdb5d2a4))
* richtext in server overview ([2fe5c66](https://github.com/Devidian/devidian-rw-manager/commit/2fe5c66c447980271b33b918b2bdc5a8237f2d74))
* steam login error did not respect base url ([2cbbbbf](https://github.com/Devidian/devidian-rw-manager/commit/2cbbbbf9c52d91b0c865ee46c20932008e0f9708))
* uid=BigInt ([f1a9958](https://github.com/Devidian/devidian-rw-manager/commit/f1a9958e6d215373a2e259cb0d25338e5f1dc410))
* use per-server online player data ([1eb3fe0](https://github.com/Devidian/devidian-rw-manager/commit/1eb3fe0a34524c5023df9ff123dee294dbcf3631))


### Build

* add frontend validation and publishing ([bf16534](https://github.com/Devidian/devidian-rw-manager/commit/bf16534ffaafd0b5c367db98cf7db329c7f79658))
* **deps-dev:** bump ajv from 6.12.6 to 6.14.0 in the npm_and_yarn group across 1 directory ([deafe95](https://github.com/Devidian/devidian-rw-manager/commit/deafe95aa0bc5d93213a8cc9757ee6a9702dc1cf))
* **deps-dev:** bump ajv in the npm_and_yarn group across 1 directory ([ee35e78](https://github.com/Devidian/devidian-rw-manager/commit/ee35e7806998c80af61968ce65729b0d4d5e9570))
* **deps-dev:** bump js-yaml ([809dda2](https://github.com/Devidian/devidian-rw-manager/commit/809dda2434457744a052e546cd99eab0bd72030d))
* **deps-dev:** bump js-yaml from 4.1.1 to 4.2.0 in the npm_and_yarn group across 1 directory ([248fd96](https://github.com/Devidian/devidian-rw-manager/commit/248fd96f6b2bef1572816a7d11220bcdea52688a))
* **deps:** bump esbuild from 0.21.5 to 0.25.0 in the npm_and_yarn group across 0 directory ([47114ba](https://github.com/Devidian/devidian-rw-manager/commit/47114bab56167b47c459a683f6fd9430f2870b5a))
* **deps:** bump esbuild in the npm_and_yarn group across 0 directory ([6fde849](https://github.com/Devidian/devidian-rw-manager/commit/6fde849c315d3d56408f8821ec04a8cd54300216))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([cc18bee](https://github.com/Devidian/devidian-rw-manager/commit/cc18bee8d48af4a364f73e018a8a97c0047c9b00))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([abe2529](https://github.com/Devidian/devidian-rw-manager/commit/abe2529f5fe7ae4744858bbb33c869859f2b82b3))
* **deps:** bump undici from 7.27.2 to 7.28.0 in the npm_and_yarn group across 1 directory ([72548b8](https://github.com/Devidian/devidian-rw-manager/commit/72548b87bb56267f731f2873dc1c108ff135e502))
* **deps:** bump undici in the npm_and_yarn group across 1 directory ([5306885](https://github.com/Devidian/devidian-rw-manager/commit/5306885a0ad326610a1b7326945bfb449e38e4de))


### Maintenance

* bump version change name ([bf8ef96](https://github.com/Devidian/devidian-rw-manager/commit/bf8ef96238c5d3338108c9744c66b5c2640ad763))
* ignore *local* files ([bda381f](https://github.com/Devidian/devidian-rw-manager/commit/bda381fb02e062b9cda095ba38dc8ce5e9b54d49))
* **main:** release rw-manager 1.0.0 ([fcdbf8b](https://github.com/Devidian/devidian-rw-manager/commit/fcdbf8b8dc125ee40b336058a73059d91efe13cc))
* **main:** release rw-manager 1.0.0 ([2a53219](https://github.com/Devidian/devidian-rw-manager/commit/2a53219f8e8e78053c1f297f3e6cdb3acd7b4700))

## 1.0.0 (2026-06-27)


### Added

* add global intercom frontend chat ([0062b5c](https://github.com/Devidian/devidian-rw-manager/commit/0062b5ca5419b845ff2db8bb322a5db429d8bcae))
* add GPS map marker layer ([c2429f1](https://github.com/Devidian/devidian-rw-manager/commit/c2429f17da4dba39bc4990844168fc2155dda280))
* add online map layers ([6b19bf7](https://github.com/Devidian/devidian-rw-manager/commit/6b19bf7ac694889eb9685cf372c0c4bbb6f6c8fc))
* added node server for deployment, env for subpath support ([fe83902](https://github.com/Devidian/devidian-rw-manager/commit/fe839029d2a6649b12cf4df0b89777dc57772e5a))
* plugin list & map (WIP) ([409d06a](https://github.com/Devidian/devidian-rw-manager/commit/409d06a61283c0167592968aa94217277751eee0))


### Fixed

* allow panning beyond generated map tiles ([bdf9d6b](https://github.com/Devidian/devidian-rw-manager/commit/bdf9d6bbb47420ac54125613bf6dfec2f4c66664))
* auth headers, express placeholders env, pre in p not allowed ([238f605](https://github.com/Devidian/devidian-rw-manager/commit/238f6056796a471ce166ea9c11c7aa89ffd915a4))
* header image uri typo ([6b492ac](https://github.com/Devidian/devidian-rw-manager/commit/6b492acc703e9a4f87a6896c5dce5dd64fc628d1))
* inject global intercom websocket env ([6c34750](https://github.com/Devidian/devidian-rw-manager/commit/6c34750c8b220bac8fd3e6c336cc6be1bfe2513d))
* pre text in server-info description ([790d18a](https://github.com/Devidian/devidian-rw-manager/commit/790d18a722e93f7bc11d8ed16ecd7fdd8ce4677c))
* refine intercom chat and map fullscreen ([8c2956c](https://github.com/Devidian/devidian-rw-manager/commit/8c2956c036b3f5eb11ff699c653c50907fa0e9e4))
* render intercom screenshot attachments ([41f945c](https://github.com/Devidian/devidian-rw-manager/commit/41f945c35cb59b081dc728c4f98e35af75c49b41))
* render intercom source colors ([f57f169](https://github.com/Devidian/devidian-rw-manager/commit/f57f1699c01d9fcbedc06516a2cfd7cf4369a935))
* richtext in server config ([63412ad](https://github.com/Devidian/devidian-rw-manager/commit/63412ad3f008e4434fcd7235feb388f3cdb5d2a4))
* richtext in server overview ([2fe5c66](https://github.com/Devidian/devidian-rw-manager/commit/2fe5c66c447980271b33b918b2bdc5a8237f2d74))
* steam login error did not respect base url ([2cbbbbf](https://github.com/Devidian/devidian-rw-manager/commit/2cbbbbf9c52d91b0c865ee46c20932008e0f9708))
* uid=BigInt ([f1a9958](https://github.com/Devidian/devidian-rw-manager/commit/f1a9958e6d215373a2e259cb0d25338e5f1dc410))
* use per-server online player data ([1eb3fe0](https://github.com/Devidian/devidian-rw-manager/commit/1eb3fe0a34524c5023df9ff123dee294dbcf3631))


### Build

* add frontend validation and publishing ([bf16534](https://github.com/Devidian/devidian-rw-manager/commit/bf16534ffaafd0b5c367db98cf7db329c7f79658))
* **deps-dev:** bump ajv from 6.12.6 to 6.14.0 in the npm_and_yarn group across 1 directory ([deafe95](https://github.com/Devidian/devidian-rw-manager/commit/deafe95aa0bc5d93213a8cc9757ee6a9702dc1cf))
* **deps-dev:** bump ajv in the npm_and_yarn group across 1 directory ([ee35e78](https://github.com/Devidian/devidian-rw-manager/commit/ee35e7806998c80af61968ce65729b0d4d5e9570))
* **deps-dev:** bump js-yaml ([809dda2](https://github.com/Devidian/devidian-rw-manager/commit/809dda2434457744a052e546cd99eab0bd72030d))
* **deps-dev:** bump js-yaml from 4.1.1 to 4.2.0 in the npm_and_yarn group across 1 directory ([248fd96](https://github.com/Devidian/devidian-rw-manager/commit/248fd96f6b2bef1572816a7d11220bcdea52688a))
* **deps:** bump esbuild from 0.21.5 to 0.25.0 in the npm_and_yarn group across 0 directory ([47114ba](https://github.com/Devidian/devidian-rw-manager/commit/47114bab56167b47c459a683f6fd9430f2870b5a))
* **deps:** bump esbuild in the npm_and_yarn group across 0 directory ([6fde849](https://github.com/Devidian/devidian-rw-manager/commit/6fde849c315d3d56408f8821ec04a8cd54300216))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([cc18bee](https://github.com/Devidian/devidian-rw-manager/commit/cc18bee8d48af4a364f73e018a8a97c0047c9b00))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([abe2529](https://github.com/Devidian/devidian-rw-manager/commit/abe2529f5fe7ae4744858bbb33c869859f2b82b3))
* **deps:** bump undici from 7.27.2 to 7.28.0 in the npm_and_yarn group across 1 directory ([72548b8](https://github.com/Devidian/devidian-rw-manager/commit/72548b87bb56267f731f2873dc1c108ff135e502))
* **deps:** bump undici in the npm_and_yarn group across 1 directory ([5306885](https://github.com/Devidian/devidian-rw-manager/commit/5306885a0ad326610a1b7326945bfb449e38e4de))


### Maintenance

* bump version change name ([bf8ef96](https://github.com/Devidian/devidian-rw-manager/commit/bf8ef96238c5d3338108c9744c66b5c2640ad763))
* ignore *local* files ([bda381f](https://github.com/Devidian/devidian-rw-manager/commit/bda381fb02e062b9cda095ba38dc8ce5e9b54d49))
