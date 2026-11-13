# Changelog

## Unreleased

* restrict player profiles to signed-in users and show guests only the first and last Steam-ID digit
* compact the duplicate detail table, color status, render formatted server names, and select all group sources
### Added

* add super-admin review of possible server duplicates with preview and confirmed multi-entry merge
* follow former server links and anonymous favorites to the canonical server after a merge

* let signed-in users save additional public Global Intercom channels and restore them on reconnect
* open player profiles from player names with current servers and available playtime
* split Global Intercom into `#GLOBAL` and `#WEB` tabs with per-channel and aggregate unread badges
* show an account's latest recorded presence in user management
* show separately colored marketplace-crier and shop-trader map markers with current offers, prices, stocks, and wallet balances
* subscribe the open map to live invalidations for only its selected server
* apply claim, player, GPS marker, and marketplace offer deltas without REST reloads
* subscribe to all dashboard server statuses over one mutable WebSocket
* show and enforce the backend-provided favorite-server limit

### Fixed

* show each online player once when multiple server addresses return the same player list; prefer the address most recently advertised by the master list
* format server names in player profiles with the same RichText renderer used by server cards
* align month and ISO-week statistics with the selected local calendar period
* avoid redrawing unchanged global statistics during unrelated updates
* render native plugin inventory entries without obsolete deployment-directory values
* back off reconnects until the map subscription is confirmed
* use periodic REST player refresh only while live updates are unavailable
* resume `/live` polling only while the server-status WebSocket is unavailable

## [1.9.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.8.1...rw-manager-v1.9.0) (2026-11-11)


### Added

* add server duplicate review panel ([8fc6341](https://github.com/Devidian/devidian-rw-manager/commit/8fc6341ccc2505e0dcac3313e6d14256ea4e2635))


### Fixed

* improve duplicate review table and selection ([f0541e3](https://github.com/Devidian/devidian-rw-manager/commit/f0541e328bb44fbcb8e95be50b74de860b29fbda))


### Documentation

* prepare Manager frontend 1.9.0 stable release ([5e9475e](https://github.com/Devidian/devidian-rw-manager/commit/5e9475efc06f715bba1c136e1c1cb4f3dda649e0))
* record frontend duplicate review RC acceptance ([00cbb9a](https://github.com/Devidian/devidian-rw-manager/commit/00cbb9aafbe39e9a8a22ecfd48566857667d5485))
* record frontend RC rollout evidence ([2dafba7](https://github.com/Devidian/devidian-rw-manager/commit/2dafba76895925aabbb8f2eb027493484a59d88f))

## [1.8.1](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.8.0...rw-manager-v1.8.1) (2026-11-09)


### Fixed

* show live server names in pinned sidebar ([a7ddbd2](https://github.com/Devidian/devidian-rw-manager/commit/a7ddbd2dbe8199feaf2801c432f8243876a80a4a))


### Build

* publish frontend images from stable v tags ([b0a423f](https://github.com/Devidian/devidian-rw-manager/commit/b0a423fc9c9a25bd67ee9db51d3dfd18aa604c40))
* publish stable Manager frontend Docker tags ([0787067](https://github.com/Devidian/devidian-rw-manager/commit/0787067c637fc9f08506a479f8fa745c99c4bf14))

## [1.8.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.7.0...rw-manager-v1.8.0) (2026-10-26)


### Added

* add manager web chat channel ([08bcc37](https://github.com/Devidian/devidian-rw-manager/commit/08bcc37e6fb5cb6024b446f3b1e2bafbf3f40a33))
* prepare manager frontend RC 1.8.0-rc.1 ([3d3930d](https://github.com/Devidian/devidian-rw-manager/commit/3d3930d51cda1d20afb2fca1d813d961afe02f41))
* prepare manager frontend RC 1.8.0-rc.2 ([b376384](https://github.com/Devidian/devidian-rw-manager/commit/b3763840963e3f628120348122f2ee94ca790a44))
* show native plugin access state ([ca0e0e0](https://github.com/Devidian/devidian-rw-manager/commit/ca0e0e06333c8f5d104f67fdc0c975a055fca8f3))
* show stored player metrics in server details rc.5 ([61b8ca9](https://github.com/Devidian/devidian-rw-manager/commit/61b8ca9be9ebcf7c4c911aa7b721bea6b5501651))


### Fixed

* deduplicate online players across server addresses for rc.3 ([402cd8f](https://github.com/Devidian/devidian-rw-manager/commit/402cd8f3a086b237acb02c4860854921609d622a))
* keep server statistics charts mounted in rc.4 ([3d31213](https://github.com/Devidian/devidian-rw-manager/commit/3d312139b20c564543b6144515bdaf4bbf3450ad))
* remove browser Steam API lookup for frontend rc.7 ([35617d9](https://github.com/Devidian/devidian-rw-manager/commit/35617d91848eef50a2212996e57a99f62288edc8))
* replace Lovable social metadata for frontend rc.6 ([3653826](https://github.com/Devidian/devidian-rw-manager/commit/3653826298eb924c665013b107b22b5bb3796ccd))
* start Steam login without click event ([9f41934](https://github.com/Devidian/devidian-rw-manager/commit/9f419343028bb6d0b9b3832deef31c938335981b))
* use Steam persona names for sign-in ([abef736](https://github.com/Devidian/devidian-rw-manager/commit/abef736cea0f48d2018f71da8c7b0ebe576afd4b))


### Documentation

* prepare accepted frontend 1.8.0 stable release ([a273d59](https://github.com/Devidian/devidian-rw-manager/commit/a273d59cd9b51ab469e055ff1240ebe895d65baf))
* reconcile active manager frontend plans ([96c2af1](https://github.com/Devidian/devidian-rw-manager/commit/96c2af130620133d89bad82a55565d84a10d08ae))


### Maintenance

* prepare frontend rc.3 ([a44074b](https://github.com/Devidian/devidian-rw-manager/commit/a44074b2ffc1692f74a6a8b02c1f65735d0f3ee1))

## [1.7.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.6.1...rw-manager-v1.7.0) (2026-09-11)


### Added

* add embeddable server map ([81d1a31](https://github.com/Devidian/devidian-rw-manager/commit/81d1a311a2d8ba786caa4dac754cf6090b6c490f))
* add global marketplace tab rc ([3229ba1](https://github.com/Devidian/devidian-rw-manager/commit/3229ba1d5988ac13971ea6c35fbfaae50cc35a50))
* add map coordinate controls ([93e0917](https://github.com/Devidian/devidian-rw-manager/commit/93e0917b6ac1adae8de017badf4c5e64b7de9dd8))
* copy map teleport commands ([d9f59ed](https://github.com/Devidian/devidian-rw-manager/commit/d9f59ed297c5ecda92d65478093c5e067d1f0cf6))
* enrich NPC market offers for rc ([e675e4f](https://github.com/Devidian/devidian-rw-manager/commit/e675e4f65ce78859970b6745f038c19b1aa779f8))
* improve manager map controls and badges ([3199a6c](https://github.com/Devidian/devidian-rw-manager/commit/3199a6cd6e06aab4c015606713f26973da722ffc))
* show NPC markets on map ([3a82930](https://github.com/Devidian/devidian-rw-manager/commit/3a829303e02df720201d12007f6ccb4e7a0eaca5))


### Fixed

* align player map history with world coordinates ([839b1d0](https://github.com/Devidian/devidian-rw-manager/commit/839b1d0a5934f7295164cd4bec80428fb0ec4a2a))
* confirm map clipboard results ([2d6eca7](https://github.com/Devidian/devidian-rw-manager/commit/2d6eca755b5b7687383fe04dba37b6b00d6ecbf5))
* copy map context menu values ([1541e77](https://github.com/Devidian/devidian-rw-manager/commit/1541e77c8ed9c9653c806e3ff8190251fabe53a8))
* expose map copy fallbacks ([8003d28](https://github.com/Devidian/devidian-rw-manager/commit/8003d281c3690531b30ab08cf424088f50809925))
* fill embedded map viewport ([f2b75bd](https://github.com/Devidian/devidian-rw-manager/commit/f2b75bd7c64048022aac4abd92cfcf4cd3d0fd05))
* honor disabled map auto refresh ([a6c0378](https://github.com/Devidian/devidian-rw-manager/commit/a6c03784cf58c7e5f9eb511e429e128357a694de))
* load server headers through manager backend ([d363e18](https://github.com/Devidian/devidian-rw-manager/commit/d363e18aa842ddc6dae85403fab029313e0e8cc3))
* open map copy dialog before leaflet click ([a796b89](https://github.com/Devidian/devidian-rw-manager/commit/a796b8952ddfb1f519ea5315b5f9df41db213cea))
* preload refreshed map tiles ([7f9d3ab](https://github.com/Devidian/devidian-rw-manager/commit/7f9d3ab9338532846790c6ff84a6b11e7aaed44b))
* preserve map copy user activation ([c7f1f09](https://github.com/Devidian/devidian-rw-manager/commit/c7f1f09b89098c90b7f04d918620ab71f7f17cec))
* provide iframe-safe map copy fallback ([07b9fbf](https://github.com/Devidian/devidian-rw-manager/commit/07b9fbf17e2ede78557333d8054de909cc5a7a64))
* render server description formatting ([eadd627](https://github.com/Devidian/devidian-rw-manager/commit/eadd627e14bea1892f97da7c7398b9f66d33a8e8))
* request refreshed map tiles ([ed04996](https://github.com/Devidian/devidian-rw-manager/commit/ed049967a5755f2cb1270b9a7af090cdc565c4c8))
* restore manager CI and dependency updates ([16b9a7d](https://github.com/Devidian/devidian-rw-manager/commit/16b9a7dd849ddeb17737cf61c85f89460220cf13))
* show map copy value directly ([c8c4a65](https://github.com/Devidian/devidian-rw-manager/commit/c8c4a65b6ecba77b46cab522ac62516f964b0e88))
* target embedded maps by server ([4cbdf1b](https://github.com/Devidian/devidian-rw-manager/commit/4cbdf1b4e3090cec7e83a81773e808cad22e3330))
* throttle map tile refreshes ([60b5c4a](https://github.com/Devidian/devidian-rw-manager/commit/60b5c4a8d54c067a8f1519d20b63079ab9c9ac40))
* widen market information dialogs ([f44197c](https://github.com/Devidian/devidian-rw-manager/commit/f44197cde8a57025b132a0416b2544a426afaa3c))


### Build

* **deps:** bump the npm_and_yarn group across 1 directory with 5 updates ([08212a3](https://github.com/Devidian/devidian-rw-manager/commit/08212a3a6e99890f86e2028dfad15d4f0e3428e5))
* **deps:** bump the npm_and_yarn group across 1 directory with 5 updates ([1520c49](https://github.com/Devidian/devidian-rw-manager/commit/1520c495290602cbc328607cdae560c6d0e2ec62))


### Maintenance

* **main:** release rw-manager 1.6.1 ([7282d92](https://github.com/Devidian/devidian-rw-manager/commit/7282d92767f525f696fdc58c5eef42c39da8ae57))
* **main:** release rw-manager 1.6.1 ([7a04eb2](https://github.com/Devidian/devidian-rw-manager/commit/7a04eb2a3fb60b29855b45b9264e9c06de7cbd78))
* prepare 1.7.0 release ([8a8cf73](https://github.com/Devidian/devidian-rw-manager/commit/8a8cf73df77e1e4ce362d6ffecc90e7b8f845d09))

## [1.6.1](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.6.1...rw-manager-v1.6.1) (2026-09-09)


### Added

* improve manager map controls and badges ([3199a6c](https://github.com/Devidian/devidian-rw-manager/commit/3199a6cd6e06aab4c015606713f26973da722ffc))


### Fixed

* align player map history with world coordinates ([839b1d0](https://github.com/Devidian/devidian-rw-manager/commit/839b1d0a5934f7295164cd4bec80428fb0ec4a2a))
* load server headers through manager backend ([d363e18](https://github.com/Devidian/devidian-rw-manager/commit/d363e18aa842ddc6dae85403fab029313e0e8cc3))
* render server description formatting ([eadd627](https://github.com/Devidian/devidian-rw-manager/commit/eadd627e14bea1892f97da7c7398b9f66d33a8e8))
* restore manager CI and dependency updates ([16b9a7d](https://github.com/Devidian/devidian-rw-manager/commit/16b9a7dd849ddeb17737cf61c85f89460220cf13))


### Build

* **deps:** bump the npm_and_yarn group across 1 directory with 5 updates ([08212a3](https://github.com/Devidian/devidian-rw-manager/commit/08212a3a6e99890f86e2028dfad15d4f0e3428e5))
* **deps:** bump the npm_and_yarn group across 1 directory with 5 updates ([1520c49](https://github.com/Devidian/devidian-rw-manager/commit/1520c495290602cbc328607cdae560c6d0e2ec62))

## [1.6.1](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.6.0...rw-manager-v1.6.1) (2026-09-05)


### Added

* refine server capability presentation ([e7e18d1](https://github.com/Devidian/devidian-rw-manager/commit/e7e18d13703825f6abfd89ee7ea9bc17f0132c86))
* show live online player count ([9d332e5](https://github.com/Devidian/devidian-rw-manager/commit/9d332e525e6fa3e66b295b4625201051f310e903))


### Fixed

* prefer live player list counts ([65a6d86](https://github.com/Devidian/devidian-rw-manager/commit/65a6d86cce4e27dd6e4538d7dbc366c5185aa999))
* report native online player status in manager MCP ([15ced63](https://github.com/Devidian/devidian-rw-manager/commit/15ced63dda1c4ec0051ab2543830e58e930f8b17))
* show native plugin inventory ([70fd329](https://github.com/Devidian/devidian-rw-manager/commit/70fd32966d3db3cd0014b79c7bc005f0c35ad657))


### Build

* **deps-dev:** bump browserslist ([6afa62a](https://github.com/Devidian/devidian-rw-manager/commit/6afa62a171925bd5d825e120a58038b6a98642c7))
* **deps-dev:** bump browserslist from 4.25.1 to 4.28.8 in the npm_and_yarn group across 1 directory ([9e97c74](https://github.com/Devidian/devidian-rw-manager/commit/9e97c74328b03490e5fc34df5897a29a17845781))

## [1.6.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.6.0...rw-manager-v1.6.0) (2026-08-14)


### Added

* add global intercom frontend chat ([0062b5c](https://github.com/Devidian/devidian-rw-manager/commit/0062b5ca5419b845ff2db8bb322a5db429d8bcae))
* add GPS map marker layer ([c2429f1](https://github.com/Devidian/devidian-rw-manager/commit/c2429f17da4dba39bc4990844168fc2155dda280))
* add online map layers ([6b19bf7](https://github.com/Devidian/devidian-rw-manager/commit/6b19bf7ac694889eb9685cf372c0c4bbb6f6c8fc))
* added node server for deployment, env for subpath support ([fe83902](https://github.com/Devidian/devidian-rw-manager/commit/fe839029d2a6649b12cf4df0b89777dc57772e5a))
* clarify manager server list badges ([09727dd](https://github.com/Devidian/devidian-rw-manager/commit/09727dd8227e8515391abe56f638cf3fced27650))
* consume live dashboard server status ([7008492](https://github.com/Devidian/devidian-rw-manager/commit/7008492f69b3c15a09292f6aeb5ef59f18b95e6a))
* identify legacy intercom servers ([21ccb37](https://github.com/Devidian/devidian-rw-manager/commit/21ccb37e297f33437d8b28e805109308ed9d276a))
* identify web chat users ([20cffc1](https://github.com/Devidian/devidian-rw-manager/commit/20cffc16cedcdac1a450cf4954c3598f36d35832))
* improve manager server list and statistics ([cac0d4e](https://github.com/Devidian/devidian-rw-manager/commit/cac0d4e46f9bbba9068172a890acc72933e6bd9d))
* plugin list & map (WIP) ([409d06a](https://github.com/Devidian/devidian-rw-manager/commit/409d06a61283c0167592968aa94217277751eee0))
* refresh map tiles around online players ([3a7d7f9](https://github.com/Devidian/devidian-rw-manager/commit/3a7d7f96c2982cdb35e6ac4cbe6de020ca4c3e88))
* release manager map UI updates ([4f7e77f](https://github.com/Devidian/devidian-rw-manager/commit/4f7e77fa678459a09c88d5fccf634f66a57b31fa))
* show global intercom server presence ([392ab62](https://github.com/Devidian/devidian-rw-manager/commit/392ab62737c723529c629c309758cb0fe587811d))
* subscribe maps to live server updates ([db284d1](https://github.com/Devidian/devidian-rw-manager/commit/db284d1d7ea15b730a59c0814b6fe727036ca915))
* toggle global intercom player presence ([c20e163](https://github.com/Devidian/devidian-rw-manager/commit/c20e16375962a85bfa841f64bc383d0a692cb01e))


### Fixed

* allow panning beyond generated map tiles ([bdf9d6b](https://github.com/Devidian/devidian-rw-manager/commit/bdf9d6bbb47420ac54125613bf6dfec2f4c66664))
* apply live map entity deltas ([93fa616](https://github.com/Devidian/devidian-rw-manager/commit/93fa61695334ec95a7a461a4c17907c2f14ac44a))
* auth headers, express placeholders env, pre in p not allowed ([238f605](https://github.com/Devidian/devidian-rw-manager/commit/238f6056796a471ce166ea9c11c7aa89ffd915a4))
* header image uri typo ([6b492ac](https://github.com/Devidian/devidian-rw-manager/commit/6b492acc703e9a4f87a6896c5dce5dd64fc628d1))
* inject global intercom websocket env ([6c34750](https://github.com/Devidian/devidian-rw-manager/commit/6c34750c8b220bac8fd3e6c336cc6be1bfe2513d))
* keep live map session across detail tabs ([69cc785](https://github.com/Devidian/devidian-rw-manager/commit/69cc7856a65f81727beb50923de9c16004f5d064))
* keep rc images off stable tags ([b23be10](https://github.com/Devidian/devidian-rw-manager/commit/b23be100faacc211521498c5f00ab6846f54db7d))
* pre text in server-info description ([790d18a](https://github.com/Devidian/devidian-rw-manager/commit/790d18a722e93f7bc11d8ed16ecd7fdd8ce4677c))
* refine intercom chat and map fullscreen ([8c2956c](https://github.com/Devidian/devidian-rw-manager/commit/8c2956c036b3f5eb11ff699c653c50907fa0e9e4))
* refine map refresh and dashboard pins ([a227caf](https://github.com/Devidian/devidian-rw-manager/commit/a227cafca6dcc335707432b79ec3718ef5d596f1))
* refresh claims and build images natively ([7bf2536](https://github.com/Devidian/devidian-rw-manager/commit/7bf2536b2def5af87ad2d3fd41ecb6d9c9ceab4b))
* refresh map tiles while players explore ([ff9cc92](https://github.com/Devidian/devidian-rw-manager/commit/ff9cc92c040993c011264fd210057a169345021b))
* refresh player map layer every 30 seconds ([547069b](https://github.com/Devidian/devidian-rw-manager/commit/547069b03edae9e8afc414e3872244328c668cc2))
* remount intercom presence tabs ([c770a42](https://github.com/Devidian/devidian-rw-manager/commit/c770a42c9a8f8cb33252d960f9a78e1dc8cc731b))
* remove unmerged code ([244f0c9](https://github.com/Devidian/devidian-rw-manager/commit/244f0c9630799b77f0725aca5d0ca2038356dc96))
* render global intercom server colors ([e72a3ff](https://github.com/Devidian/devidian-rw-manager/commit/e72a3ff5bb3174f5bbf250240224160b24377256))
* render intercom screenshot attachments ([41f945c](https://github.com/Devidian/devidian-rw-manager/commit/41f945c35cb59b081dc728c4f98e35af75c49b41))
* render intercom source colors ([f57f169](https://github.com/Devidian/devidian-rw-manager/commit/f57f1699c01d9fcbedc06516a2cfd7cf4369a935))
* richtext in server config ([63412ad](https://github.com/Devidian/devidian-rw-manager/commit/63412ad3f008e4434fcd7235feb388f3cdb5d2a4))
* richtext in server overview ([2fe5c66](https://github.com/Devidian/devidian-rw-manager/commit/2fe5c66c447980271b33b918b2bdc5a8237f2d74))
* separate intercom presence views ([042c172](https://github.com/Devidian/devidian-rw-manager/commit/042c1726d3772748a5109fcfe8de42e8106eae66))
* steam login error did not respect base url ([2cbbbbf](https://github.com/Devidian/devidian-rw-manager/commit/2cbbbbf9c52d91b0c865ee46c20932008e0f9708))
* uid=BigInt ([f1a9958](https://github.com/Devidian/devidian-rw-manager/commit/f1a9958e6d215373a2e259cb0d25338e5f1dc410))
* unblock manager frontend ci ([6de072f](https://github.com/Devidian/devidian-rw-manager/commit/6de072fe9355cc8306f3c4dc335ddfaa10de9d38))
* use per-server online player data ([1eb3fe0](https://github.com/Devidian/devidian-rw-manager/commit/1eb3fe0a34524c5023df9ff123dee294dbcf3631))


### Documentation

* complete frontend qol rc plan ([c2c7633](https://github.com/Devidian/devidian-rw-manager/commit/c2c76331a18c7b340b39d9f3999fe5f88b628eaf))
* record city color rc deployment ([f7c7f86](https://github.com/Devidian/devidian-rw-manager/commit/f7c7f86f13945ec6601a9fd1ade84079c5997790))


### Build

* add frontend validation and publishing ([bf16534](https://github.com/Devidian/devidian-rw-manager/commit/bf16534ffaafd0b5c367db98cf7db329c7f79658))
* **deps-dev:** bump ajv from 6.12.6 to 6.14.0 in the npm_and_yarn group across 1 directory ([deafe95](https://github.com/Devidian/devidian-rw-manager/commit/deafe95aa0bc5d93213a8cc9757ee6a9702dc1cf))
* **deps-dev:** bump ajv in the npm_and_yarn group across 1 directory ([ee35e78](https://github.com/Devidian/devidian-rw-manager/commit/ee35e7806998c80af61968ce65729b0d4d5e9570))
* **deps-dev:** bump brace-expansion ([aef05f4](https://github.com/Devidian/devidian-rw-manager/commit/aef05f49d3741619e70c416a6244ed76501fffff))
* **deps-dev:** bump brace-expansion from 1.1.16 to 1.1.18 in the npm_and_yarn group across 1 directory ([b16023a](https://github.com/Devidian/devidian-rw-manager/commit/b16023a2a1ccec059301a3d40d8ebc226767a3d3))
* **deps-dev:** bump js-yaml ([809dda2](https://github.com/Devidian/devidian-rw-manager/commit/809dda2434457744a052e546cd99eab0bd72030d))
* **deps-dev:** bump js-yaml from 4.1.1 to 4.2.0 in the npm_and_yarn group across 1 directory ([248fd96](https://github.com/Devidian/devidian-rw-manager/commit/248fd96f6b2bef1572816a7d11220bcdea52688a))
* **deps-dev:** bump js-yaml to 4.3.1 ([8b8dabd](https://github.com/Devidian/devidian-rw-manager/commit/8b8dabdbb42a11141ea9042ca657946dbd20a8f1))
* **deps-dev:** bump the npm_and_yarn group across 1 directory with 3 updates ([96a5dcc](https://github.com/Devidian/devidian-rw-manager/commit/96a5dcc57138b6fc7c4875df1abff41e8ebe9988))
* **deps-dev:** bump the npm_and_yarn group across 1 directory with 3 updates ([181a0a0](https://github.com/Devidian/devidian-rw-manager/commit/181a0a0c4049e7dc4a14c5d440ab9ca1511b27bb))
* **deps:** bump body-parser ([ea26b66](https://github.com/Devidian/devidian-rw-manager/commit/ea26b666e514e9bbdb497301bea2de7e64bd5519))
* **deps:** bump body-parser from 2.2.2 to 2.3.0 in the npm_and_yarn group across 1 directory ([dd0cfe1](https://github.com/Devidian/devidian-rw-manager/commit/dd0cfe1d445b918df8206286f8b276c5b0fad3b2))
* **deps:** bump esbuild from 0.21.5 to 0.25.0 in the npm_and_yarn group across 0 directory ([47114ba](https://github.com/Devidian/devidian-rw-manager/commit/47114bab56167b47c459a683f6fd9430f2870b5a))
* **deps:** bump esbuild in the npm_and_yarn group across 0 directory ([6fde849](https://github.com/Devidian/devidian-rw-manager/commit/6fde849c315d3d56408f8821ec04a8cd54300216))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([cc18bee](https://github.com/Devidian/devidian-rw-manager/commit/cc18bee8d48af4a364f73e018a8a97c0047c9b00))
* **deps:** bump the npm_and_yarn group across 1 directory with 12 updates ([abe2529](https://github.com/Devidian/devidian-rw-manager/commit/abe2529f5fe7ae4744858bbb33c869859f2b82b3))
* **deps:** bump the npm_and_yarn group across 1 directory with 2 updates ([4df6375](https://github.com/Devidian/devidian-rw-manager/commit/4df6375534b67be8de7eeab1f4e69e78d12a3599))
* **deps:** bump the npm_and_yarn group across 1 directory with 2 updates ([8f1c31f](https://github.com/Devidian/devidian-rw-manager/commit/8f1c31f56abd92d93151a46b80c2be766b9e8d02))
* **deps:** bump undici from 7.27.2 to 7.28.0 in the npm_and_yarn group across 1 directory ([72548b8](https://github.com/Devidian/devidian-rw-manager/commit/72548b87bb56267f731f2873dc1c108ff135e502))
* **deps:** bump undici in the npm_and_yarn group across 1 directory ([5306885](https://github.com/Devidian/devidian-rw-manager/commit/5306885a0ad326610a1b7326945bfb449e38e4de))
* update action versions ([9b10f45](https://github.com/Devidian/devidian-rw-manager/commit/9b10f45cef2f076e2a03ff82a05459b42239f760))


### Maintenance

* add codex custom agents ([63c6b07](https://github.com/Devidian/devidian-rw-manager/commit/63c6b07baa9318178ada538fa6d2400630750ebd))
* bump version change name ([bf8ef96](https://github.com/Devidian/devidian-rw-manager/commit/bf8ef96238c5d3338108c9744c66b5c2640ad763))
* force manager 1.6.0 release ([f05780a](https://github.com/Devidian/devidian-rw-manager/commit/f05780ad366e2b882d352092ac009da1df6c857e))
* ignore *local* files ([bda381f](https://github.com/Devidian/devidian-rw-manager/commit/bda381fb02e062b9cda095ba38dc8ce5e9b54d49))
* **main:** release rw-manager 1.0.0 ([fcdbf8b](https://github.com/Devidian/devidian-rw-manager/commit/fcdbf8b8dc125ee40b336058a73059d91efe13cc))
* **main:** release rw-manager 1.0.0 ([2a53219](https://github.com/Devidian/devidian-rw-manager/commit/2a53219f8e8e78053c1f297f3e6cdb3acd7b4700))
* **main:** release rw-manager 1.2.0 ([dbff391](https://github.com/Devidian/devidian-rw-manager/commit/dbff391faea737c26bef904de95b79c9d92fe60d))
* **main:** release rw-manager 1.2.0 ([3eb7e36](https://github.com/Devidian/devidian-rw-manager/commit/3eb7e36c66a3a9d1616257cd74ced5c10740ebec))
* **main:** release rw-manager 1.2.1 ([996aed1](https://github.com/Devidian/devidian-rw-manager/commit/996aed122a7731370d4f6e2763a44c35b80bd99e))
* **main:** release rw-manager 1.3.0 ([01ac266](https://github.com/Devidian/devidian-rw-manager/commit/01ac2664cdadbcfbdce68cfb3cb1280d4edd71d8))
* **main:** release rw-manager 1.4.0 ([251fcb3](https://github.com/Devidian/devidian-rw-manager/commit/251fcb3081bd2b334bd085aed432726681bfbbf9))
* **main:** release rw-manager 1.4.0 ([16a6880](https://github.com/Devidian/devidian-rw-manager/commit/16a6880a7dbc97192208ab8f694981ee4f34ed96))
* prepare manager frontend 1.6.0-rc.2 ([7a17b98](https://github.com/Devidian/devidian-rw-manager/commit/7a17b98d4082e0a6a00c6b3ec47d81ab983e2da9))
* prepare release please 1.6.0 ([947bb77](https://github.com/Devidian/devidian-rw-manager/commit/947bb779ffbd9e6a3384db3dbcb1ec02c7f8ccbf))
* release 1.5.0 ([b54b121](https://github.com/Devidian/devidian-rw-manager/commit/b54b1210b9f38eaf634456a8b83e35e64355161c))
* release rw-manager 1.3.0 ([a0e5fd1](https://github.com/Devidian/devidian-rw-manager/commit/a0e5fd1f26c18d0b8b38e3a85346f7b797bb0259))


### Tests

* cover city and leasehold map colors ([0ade53f](https://github.com/Devidian/devidian-rw-manager/commit/0ade53f4a189bb1b34fc730a10e84180b29fd8dc))

## [1.4.0](https://github.com/Devidian/devidian-rw-manager/compare/rw-manager-v1.3.0...rw-manager-v1.4.0) (2026-08-10)


### Added

* refresh map tiles around online players ([3a7d7f9](https://github.com/Devidian/devidian-rw-manager/commit/3a7d7f96c2982cdb35e6ac4cbe6de020ca4c3e88))


### Fixed

* keep rc images off stable tags ([b23be10](https://github.com/Devidian/devidian-rw-manager/commit/b23be100faacc211521498c5f00ab6846f54db7d))
* refine map refresh and dashboard pins ([a227caf](https://github.com/Devidian/devidian-rw-manager/commit/a227cafca6dcc335707432b79ec3718ef5d596f1))


### Documentation

* record city color rc deployment ([f7c7f86](https://github.com/Devidian/devidian-rw-manager/commit/f7c7f86f13945ec6601a9fd1ade84079c5997790))


### Tests

* cover city and leasehold map colors ([0ade53f](https://github.com/Devidian/devidian-rw-manager/commit/0ade53f4a189bb1b34fc730a10e84180b29fd8dc))

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
