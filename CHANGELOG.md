# [2.2.0](https://github.com/fhswf/tagflip-backend/compare/v2.1.0...v2.2.0) (2020-12-31)


### Features

* Importer for CoNLL 2003 (NER) files ([bf70dc7](https://github.com/fhswf/tagflip-backend/commit/bf70dc7dda938dcb356cc63161a3d801b5427706))
* importer for tsv ([e9baeed](https://github.com/fhswf/tagflip-backend/commit/e9baeed176f9e64d95c143b39f7fe30820bad4f7))

# [2.1.0](https://github.com/fhswf/tagflip-backend/compare/v2.0.0...v2.1.0) (2020-10-17)


### Features

* Import and Export of annotated Corpora with exemplary implementations for Brat-Standoff-Import and WebAnno TSV 3.2 Export. ([4924171](https://github.com/fhswf/tagflip-backend/commit/4924171ed6172398ee87b1d0b826a3ee163ed4c4))

# [2.0.0](https://github.com/fhswf/tagflip-backend/compare/v1.4.0...v2.0.0) (2020-09-24)


### Features

* Support for Annotation Tasks ([3227f3b](https://github.com/fhswf/tagflip-backend/commit/3227f3b23668ff692e138f98e95b683c0c155f12))


### BREAKING CHANGES

* Release loses any compatibility to prior releases due
to heavy changes on domain model.

# [1.4.0](https://github.com/fhswf/tagflip-backend/compare/v1.3.1...v1.4.0) (2020-08-25)


### Features

* Adding possibility to filter by field on search ([e0b27ba](https://github.com/fhswf/tagflip-backend/commit/e0b27bae626392014d9b35903a1b689330f0888d))
* Improving performance on document table in corpus settings ([fb96348](https://github.com/fhswf/tagflip-backend/commit/fb963485896f40cc527f0e58aab6ffe950a77f69))

## [1.3.1](https://github.com/fhswf/tagflip-backend/compare/v1.3.0...v1.3.1) (2020-08-23)


### Bug Fixes

* amend existing annotation set ([39b38ef](https://github.com/fhswf/tagflip-backend/commit/39b38efc01db73d497236ea91dbe80d5b20e403b))

# [1.3.0](https://github.com/fhswf/tagflip-backend/compare/v1.2.2...v1.3.0) (2020-08-23)


### Features

* Import of NoSta-D documents ([73b0393](https://github.com/fhswf/tagflip-backend/commit/73b0393f5df596e39036567d56fd7eb73df91231))

## [1.2.2](https://github.com/fhswf/tagflip-backend/compare/v1.2.1...v1.2.2) (2020-08-23)


### Bug Fixes

* Added missing schema. ([d34a641](https://github.com/fhswf/tagflip-backend/commit/d34a6415a1787936d1a033a5809d35171f2bf071))

## [1.2.1](https://github.com/fhswf/tagflip-backend/compare/v1.2.0...v1.2.1) (2020-08-23)


### Bug Fixes

* build dependency on npmjs.org ([2b595db](https://github.com/fhswf/tagflip-backend/commit/2b595db5e4705ffb1c70f4e446d15cd9108e5df3))
* references to @fhswf/tagflip-common ([5e857e8](https://github.com/fhswf/tagflip-backend/commit/5e857e8b9bf765e56e066135769766a3801ab9da))

# [1.2.0](https://github.com/fhswf/tagflip-backend/compare/v1.1.1...v1.2.0) (2020-08-22)


### Features

* persisting documents to DB instead of filesystem. ([5c577b9](https://github.com/fhswf/tagflip-backend/commit/5c577b95b8b28cedc355fd66eb63c1a15118dec4))

## [1.1.1](https://github.com/fhswf/tagflip-backend/compare/v1.1.0...v1.1.1) (2020-08-08)


### Bug Fixes

* return corpus object on import ([3a06500](https://github.com/fhswf/tagflip-backend/commit/3a06500a76078e23ffcf2691a0bf23d5b7bfa570))

# [1.1.0](https://github.com/fhswf/tagflip-backend/compare/v1.0.1...v1.1.0) (2020-08-03)


### Bug Fixes

* fix error handling in DocumentService ([5d048de](https://github.com/fhswf/tagflip-backend/commit/5d048de8b4459b610b837d267a05c79611a6e0e9))
* fix one-off error ([11e03f3](https://github.com/fhswf/tagflip-backend/commit/11e03f32756ac00d82a76e1566509dbe0121dd85))
* reference to index.js.bak in package.json ([0e3e4f6](https://github.com/fhswf/tagflip-backend/commit/0e3e4f6a740a080458426da7db25f3013a3ba587))


### Features

* Import functionality (currently only TSV files in IOB format) ([2b3e9cf](https://github.com/fhswf/tagflip-backend/commit/2b3e9cf687dec23910506c0885f318afb668617b))
* import of tagged documents ([8ea0473](https://github.com/fhswf/tagflip-backend/commit/8ea0473c547d7da0251a772d1a640ec6e7a7587d))
* Import service ([793c7e6](https://github.com/fhswf/tagflip-backend/commit/793c7e66c154a2dab878931237faa3db3cf52253))

## [1.0.1](https://github.com/fhswf/tagflip-backend/compare/v1.0.0...v1.0.1) (2020-06-14)


### Bug Fixes

* added @semantic-release/npm for update of package.json ([4ef60f0](https://github.com/fhswf/tagflip-backend/commit/4ef60f0e6b62728bc25086433122165c42bdde02))

# 1.0.0 (2020-06-14)


### Bug Fixes

* correct spelling of persistence component ([5cefb1b](https://github.com/fhswf/tagflip-backend/commit/5cefb1b3b3713694d8f4fe679f8b31e375960436))
* fix indentation error in release.yml ([0a4a747](https://github.com/fhswf/tagflip-backend/commit/0a4a7473e4dd4d0aa07890d816e2095112daa66f))
* fix indentation error in release.yml ([437d348](https://github.com/fhswf/tagflip-backend/commit/437d34843af77d64ff701d60e7a7c3ddec5704ba))
* fix release.yml workflow ([d587fe0](https://github.com/fhswf/tagflip-backend/commit/d587fe081b4290bc3dde6849ffa146272978e35a))
* package-lock.json should be checked in ([8d1ef0f](https://github.com/fhswf/tagflip-backend/commit/8d1ef0f071c2927de930c2e0062fa58c7c73cb01))
* release workflow ([d098f0f](https://github.com/fhswf/tagflip-backend/commit/d098f0f3d3eb444845486162842a8d8d1beb594c))


### Features

* adding semantic release plugin ([bb3cec1](https://github.com/fhswf/tagflip-backend/commit/bb3cec16b21e057e63dba42aa26d1325695c0638))
* **docker:** added Dockerfile and docker-compose.yml ([b238045](https://github.com/fhswf/tagflip-backend/commit/b2380452de647ea9b11d7dc65c4986b9060782a4))
