# 6. Design system

> **Status: Approved (9 Nov 2026) — Stage 3, the design system specification.**
> Follows Documents 1 to 5. Documentation only. Working file for discussion; changes are made in place.
> **Revision history.** *5 Nov 2026:* revision 2 applied the owner's first review; revision 3 made four corrections; revision 4 recorded owner decisions A to K (D6-19 to D6-27); revision 5 corrected section 10 and marked four items as pending. *9 Nov 2026:* **revision 6** records the decisions the owner approved on 9 Nov 2026 (D6-28 to D6-40, and D6-07 now approved), corrects the colour combinations that fell below WCAG 2.2 AA when calculated (4.7), removes the pending notes those decisions settle, and follows a full reread. The 5 Nov entries are kept as they were. *9 Nov 2026, later:* **revision 7** approves D6-04, 06, 08, 09, 10, 11 and the light theme (D6-05), retires the D6-18 bundle by splitting it into D6-41 to D6-54, withdraws the product-card hover zoom (D6-17, D6-56), applies the complete-photo rule to every agreed product-image placement (D6-55), keeps every performance figure provisional, and records that the Document 5 and Document 1 changes are now made in those drafts. Changes are listed in section 23. The Document 5 and Document 1 changes are made in those drafts (pending their review). Open owner questions are in section 21. *9 Nov 2026, final:* **revision 8** records the final decisions: the brand name Dhaaga with a text-only wordmark and no logo (D6-57), the home hero as one static product cover photo with no button (D6-58), no "View full photo" control for now (D6-59), banners and featured lists deferred (D6-60), performance figures provisional until validated in Document 7 and the first working build (D6-31), and the settled Document 2 and Document 4 items.
> **This document is Stage 3 of the Document 6 process: the design system specification only.** The owner approved it on 9 Nov 2026. The visual component library (Stage 4) and the full screen designs (Stage 5: Storefront, Vendor area, Admin area) were built afterwards as separate visual pages and **approved by the owner on 9 Nov 2026** (checklist rows 24 to 27). Items marked open (section 21) and figures marked provisional (section 14) stay open or provisional after approval.

## 1. Purpose and scope

The visual rules that every screen in Document 5 follows: colour, type, spacing, layout, responsive behaviour, how components look and behave in each state, forms and validation feedback, loading, empty and error states, accessibility, icons, images, motion and performance targets.

It describes **what things look like and how they behave for the person using them**. It does not describe how they are built. Component code, hooks, packages, folder structure, loading mechanisms, scripts and how tokens are wired into Tailwind CSS and shadcn/ui (D-03) are in Document 7. Where a visual rule needs something from Document 7, it is listed as an implementation constraint (14.1).

**Backend documentation is authoritative (D6-26).** Useful backend figures, such as image and upload limits and rendition sizes, are quoted here for design context, each with its source (section 18). If a figure here differs from the backend documentation, or the backend changes, the backend documentation takes priority and this document is corrected. Behaviour, error codes and data shapes are not restated beyond what a visual rule needs.

Document 6 has three parts, delivered in stages with owner approval between them:

| Part | What | Stage | State |
| --- | --- | --- | --- |
| Design system specification | This document | 3 | Approved (9 Nov 2026) |
| Visual component library | Rendered components with their important states, the same across storefront, vendor and admin | 4 | **Approved (9 Nov 2026).** Built as a separate visual page; corrected after build (one-time code is one field, D6-24; two unsupported example claims removed) |
| Screen designs | Every screen in Document 5 (storefront, vendor, admin), mobile and desktop | 5 | In progress, area by area. **Storefront: approved 9 Nov 2026. Vendor area: approved 9 Nov 2026. Admin area: approved 9 Nov 2026. Stage 5 screen designs are complete (the checks listed in checklist row 27 remain open).** |

**What "meets" means in this document.** Rules about contrast, target size, focus, motion and similar are **design targets**. This document sets rules meant to reach WCAG 2.2 level AA (D-17) and the performance targets (D-11), and it records the contrast ratios calculated for the colour values. Whether a built component or screen actually reaches them is shown by checks in Stage 4 and Stage 5 and by implementation and testing (Document 7). Nothing here claims that conformance has been achieved.

The **direction** was chosen in Stages 1 and 2 from eight rendered options. The comparison page is a working file, not part of this specification.

**Design-quality references.** Besides Documents 1 to 5, two design-quality references were used as review checklists: the `frontend-design` guidance and the open-source `taste-skill` (https://github.com/Leonxlnx/taste-skill, read only, none of its scripts run). `taste-skill` is written for company landing pages, so it is applied **selectively**: its plain-copy rules, its one-system consistency rules, its photography-first approach and its restraint about decoration are used. Its page types, shader effects, scenes, one-section-per-screen layout and card lift are not, because this is a multi-vendor marketplace with listing, account, vendor and admin screens. It does not override any approved decision, and vendor and admin screens keep their density and plainness.

## 2. Decisions

| ID | Decision | Status |
| --- | --- | --- |
| D6-01 | **Visual direction: "Kora"** (undyed cloth: greyed linen ground, one deep madder red, stitch-line dashes), with four adjustments: solid hairlines inside vendor and admin tables; madder red kept apart from error and sale; every colour pair checked against WCAG 2.2 AA; Hindi type tuned to sit with the Latin face | Approved (5 Nov 2026) |
| D6-02 | **Separate semantic colours** for success, warning, error and information. **Madder red is the brand accent only** and is never used for error, warning, sale or any system message. Semantic colours are for status and feedback; their one solid use is the confirm button of a destructive dialog (4.3). Sale has its own colour (ochre). The requirement is approved; the exact values in section 4 are proposed | Approved (5 Nov 2026); values approved with this document (9 Nov 2026) |
| D6-03 | **One identity across storefront, vendor and admin.** The storefront is warm and distinctive; vendor and admin use the same colours, type and components with less decoration and tighter spacing (section 15) | Approved (5 Nov 2026); shared identity confirmed 9 Nov 2026 (D6-29); details approved with this document |
| D6-04 | **Colour roles:** madder = the main action, links and brand mark; ink = selected controls and chosen options; semantic colours = status and feedback (plus the solid error confirm button of a destructive dialog); ochre = price offers only. One explicit exception: the 3 px madder bar that marks the current menu section is navigation branding, not a selected-control state (4.6, rule 3). Detail in section 4 | Approved (9 Nov 2026) |
| D6-05 | **Light theme only** in the first release. No dark theme | Approved (9 Nov 2026). The first release has a light theme only; consistent with D6-29 |
| D6-06 | **Type:** Outfit for Latin text and all numbers, Noto Sans Devanagari for Hindi. Weights 400, 500, 600 (Outfit) and 400, 500 (Noto). Hindi uses looser line spacing, no letter spacing and smaller large headings (section 5) | Approved (9 Nov 2026) |
| D6-07 | **Digits:** Latin digits (0 to 9) in both English and Hindi, for prices, quantities, dates, phone numbers and codes. Devanagari digits are not used | Approved (9 Nov 2026, Q6-5) |
| D6-08 | **Breakpoints:** compact below 640 px, medium 640 to 1023 px, expanded 1024 px and above, with a content cap at 1200 px (section 7) | Approved (9 Nov 2026) |
| D6-09 | **Stitch-line decoration** is allowed on defined storefront elements and never on top of product photos. In vendor and admin it is limited to two elements (section 6.3) | Approved (9 Nov 2026) |
| D6-10 | **Tables become stacked rows below 768 px** instead of scrolling sideways. 768 px is a component threshold, separate from the layout breakpoints (7.1, 7.1a, 8.9) | Approved (9 Nov 2026) |
| D6-11 | **Hit areas are at least 44 by 44 px** for every standalone interactive control on compact screens and for the customer journeys (inline text links use the WCAG 2.5.8 inline exception, D6-27), above the WCAG 2.2 AA minimum of 24 by 24 px. A control may be drawn smaller if its hit area meets this (8.1, 11) | Approved (9 Nov 2026) |
| D6-12 | **Performance targets** for D-11 (section 14), approved on 9 Nov 2026 as practical targets for the storefront, vendor and admin areas (D6-31). The Core Web Vitals values are Google's published "good" thresholds. The page-size budgets are targets, not results; values marked "needs validation" in section 14 are confirmed by technical checks and the first real build | Approved (9 Nov 2026, D6-31). **Every figure stays provisional until it is validated technically** |
| D6-13 | **Product images** use a 4:5 frame and a defined rendition per place. **Every product-image placement shows the complete photo without cropping** (D6-33, D6-55). The 4:5 direction is tested against real vendor photography when it exists (D6-62, Document 7 T7-7; 12.1). The design stages used generated stand-in illustrations | Approved (9 Nov 2026, D6-33 and D6-55) |
| D6-14 | **No forced hero fact.** The home hero carries no number, price or claim added for design. It shows real catalogue information only when the catalogue provides it. Prices, vendor counts, reviews and promotional claims are never invented (12.4, 17) | Approved (5 Nov 2026) |
| D6-15 | **The storefront hero is designed for real fashion photography.** Placeholder garment illustrations are acceptable during development and are not the intended final presentation. The 9 Nov rule on photograph rights is D6-32 (12.4) | Approved (5 Nov 2026); extended 9 Nov 2026 (D6-32) |
| D6-16 | **A "Writing for the interface" section** (section 17): clear action-first button labels, short plain headings that say what is here or what to do, consistent sentence-case capitalisation | Approved (5 Nov 2026); the detailed rules approved with this document (9 Nov 2026) |
| D6-17 | ~~Subtle product-photo zoom on hover~~ **Withdrawn (9 Nov 2026, D6-56).** A 1.02 zoom on product-card photos was approved on 5 Nov 2026 and is removed at the owner's instruction. Product cards have no hover animation of any kind | Approved 5 Nov 2026; withdrawn 9 Nov 2026 |
| D6-18 | **Retired (9 Nov 2026).** This bundle of fourteen clarifications from the owner's review of 5 Nov 2026 is split into the individual rules D6-41 to D6-54 below. Nothing in it is lost | Retired; replaced by D6-41 to D6-54 |
| D6-19 | **Terminology: "Vendor" everywhere.** Vendor-facing, staff-facing and customer-facing screens use "Vendor"; "Seller" is not a separate interface term. Applies to labels, examples, chips and area names. Document 5's route names (`/vendor`, `/vendor/apply`) already use "vendor" and are not changed. Document 5's "seller" wording was changed in the Document 5 draft on 9 Nov 2026 (D6-40) | Approved (5 Nov 2026, decision A) |
| D6-20 | **Home page content:** category entry points, brand entry points, and a **New arrivals** section showing the newest products from the existing backend list sorted by newest. No invented product data, prices, reviews or promotional claims. The hero (D6-14, D6-15) is unchanged. There is no "View all" link from the section, because no approved route lists all products newest first (7.4; confirmed 9 Nov 2026, D6-36). The Document 5 draft now says this (D5-12) | Approved (5 Nov 2026, decision B) |
| D6-21 | **Fonts for a second script load only when text in that script is on the page**, not on every page. It must be reliable and must not compromise performance. Document 7 specifies the implementation (5.4, 14.1) | Approved (5 Nov 2026, decision D) |
| D6-22 | **No sticky cart summary, no sticky cart total and no sticky Add to cart bar.** The normal Add to cart button stays in its normal position on the product page, and the existing cart navigation stays (7.3). No sticky bottom bar is specified anywhere in this document | Approved (5 Nov 2026, decision E, for the cart summary); the Add to cart bar confirmed 9 Nov 2026 (D6-35) |
| D6-23 | **Toasts:** success stays 6 seconds, is announced as a status, and can be paused or dismissed by touch, keyboard and pointer. An error stays until it is dismissed or resolved. Nothing depends on hover (8.10) | Approved (5 Nov 2026, decision F) |
| D6-24 | **One-time code: one normal input field** that accepts a full pasted code and browser autofill. No separate boxes (8.3) | Approved (5 Nov 2026, decision G) |
| D6-25 | **Validation timing:** a field is checked when the person leaves it; no first-time errors while typing; an error clears as soon as the value is valid; the whole form is checked again on submit (9) | Approved (5 Nov 2026, decision H) |
| D6-26 | **Backend figures stay in this document for design context**; backend documentation is authoritative and takes priority (1, 12.1, 18) | Approved (5 Nov 2026, decision I) |
| D6-27 | **Inline text links** may use the WCAG 2.5.8 inline exception where its conditions are met. **Standalone controls keep the 44 by 44 px target.** The exception covers target size only (8.1, 11) | Approved (5 Nov 2026, decision K) |
| D6-28 | **The repository keeps only the Kora visual preview.** The other directions from the Stage 1 comparison are not kept there | Approved (9 Nov 2026, Q6-1) |
| D6-29 | **Vendor and admin share one identity:** the same colours, typography and components. Navigation and labels (the area label with its icon, and the menus) tell the areas apart. There is no separate colour cue and **no dark scheme** (15) | Approved (9 Nov 2026, Q6-2) |
| D6-30 | **Temporary text-based wordmark** until the brand name and final logo are decided: the name set as text, not a logo image (12.3). The final name and logo remain open (Q6-3) | Approved (9 Nov 2026, Q6-3, in part). Superseded by D6-57: the name is Dhaaga and the text wordmark is the mark, not a temporary stand-in |
| D6-31 | **Performance targets** for storefront, vendor and admin, tested on a budget-device and slower-connection profile. Existing provisional targets are kept where they apply; API response data is counted in the page-size budgets where relevant; targets that need technical validation are marked in section 14. **Every figure stays provisional until it is validated technically in Document 7 and the first working build**, on the agreed budget-device and slow-connection profiles | Approved (9 Nov 2026, Q6-4); no validation has been done |
| D6-32 | **Hero photography:** the final home hero uses genuine fashion photography whose usage permission is confirmed. Development placeholders are acceptable. No third-party or stock photography is used without confirmed rights. The source is decided in D6-58 (a product cover photo from the catalogue); which product, and the permission, are open (12.4, Q6-6) | Approved (9 Nov 2026, Q6-6, in part) |
| D6-33 | **Product cards show the complete product photo** in a 4:5 frame, without cropping; space the photo does not fill shows the frame's `sunken` ground. To be tested with real vendor photography when it exists (D6-62, T7-7; 8.6, 12.1). The other placements follow the same rule (D6-55) | Approved (9 Nov 2026) |
| D6-34 | **The Kora colour identity is kept, with madder as the brand accent**, but colour combinations that fail WCAG 2.2 AA when calculated are corrected, and text, buttons, icons, borders and component states are rechecked (4.7). This records rules, not a result: conformance is shown by the Stage 4 and 5 checks and by Document 7's tests | Approved (9 Nov 2026) |
| D6-35 | **No sticky Add to cart bar** and no sticky cart summary (D6-22). The normal Add to cart button stays in its usual place on the product page | Approved (9 Nov 2026) |
| D6-36 | **New arrivals stays on the home page without a "View all" link** until an appropriate route exists (7.4) | Approved (9 Nov 2026). Written into Document 5 section 6.1 (D5-12) |
| D6-37 | **Staff-area label: "Admin area"** (7.3, 15) | Approved (9 Nov 2026, Q6-9). Document 5 uses "Vendor area" and "Admin area" (D5-15) |
| D6-38 | **Request ID and a "Copy" button** appear on a whole-screen error only when the backend reliably provides a request ID to the screen. Otherwise the message appears without either (10) | Approved (9 Nov 2026). Written into Document 5 section 3 (D5-14); V5-5 stays open |
| D6-39 | **Saving while a restore offer is unanswered:** the person is asked "Save without them?". "Go back" sends nothing and keeps the offer and the saved copy. "Save without them" saves only the values currently on the screen; on success the offer is dismissed and the old saved copy is cleared, on failure both are kept. No question is asked if the offer was already answered (9) | Approved (9 Nov 2026). Written into Document 5 section 9 (D5-13) |
| D6-40 | **Document 5 wording:** "Become a vendor" replaces "Become a seller", and "vendor" is used throughout Document 5 (D6-19). Document 1's roles description also says "Vendors" (permissions and responsibilities unchanged) | Approved (9 Nov 2026). Applied on 9 Nov 2026 to Document 5 (including the D5-10 label) and to the roles description in Document 1 |
| D6-41 | **Navigation bar exception:** the 3 px madder bar that marks the current menu section is navigation branding, not a selected-control state (4.6, rule 3) | Approved as part of D6-04 (9 Nov 2026) |
| D6-42 | **Destructive confirm colour:** the solid error fill is permitted only for the confirm button of a destructive dialog, and nowhere else (4.3) | Approved (9 Nov 2026) |
| D6-43 | **Static skeletons:** loading skeletons have no sweep, pulse or shimmer (10, 13) | Approved (9 Nov 2026) |
| D6-44 | **Component thresholds:** a few components change at a width of their own (the type scale and tables at 768 px; the staff side menu and filter panel at 1024 px). They are not layout breakpoints and never change what a person can reach (7.1a). The table threshold is also D6-10 | Approved (9 Nov 2026; tables also in D6-10) |
| D6-45 | **Compact hit areas:** 44 by 44 px for standalone controls on compact screens (8.1) | Covered by D6-11 (approved 9 Nov 2026) |
| D6-46 | **Hover by device capability:** hover styles apply when the device has any input that can hover, never by screen width or primary input, and nothing depends on hover (8.1, 13) | Approved (9 Nov 2026) |
| D6-47 | **Language switch on compact:** it sits inside the navigation drawer as the first item, and also in the footer; it shows the other language's name in its own script (7.3) | Approved (9 Nov 2026) |
| D6-48 | **Accessible timestamps:** the full date and time is always reachable without hover (16) | Approved (9 Nov 2026) |
| D6-49 | **Fixed elements and the keyboard:** toasts, dialogs and sheets keep clear of safe areas and the on-screen keyboard, never hide a focused control, and stop being fixed on short or zoomed screens (7.3). No sticky bars exist (D6-35) | Approved (9 Nov 2026) |
| D6-50 | **Contrast verification of real combinations:** the pairs in 4.7 are calculated, and every combination a component or screen makes is checked in Stages 4 and 5 | Covered by D6-34 (approved 9 Nov 2026) |
| D6-51 | **Shared interaction rules across surfaces:** storefront, vendor and admin share states, focus ring, hit areas, validation feedback and writing rules; only spacing, density, type sizes used and decoration adapt (15) | Approved (9 Nov 2026) |
| D6-52 | **One claims rule:** the interface says only what the marketplace's own data or the owner's approved wording supports (17.1) | Approved (9 Nov 2026) |
| D6-53 | **Image numbers:** backend figures are quoted for design context with their source, and the backend documentation is authoritative (12.1, 18) | Covered by D6-26 (approved 5 Nov 2026) |
| D6-54 | **Performance budget definitions:** what the initial-load budget counts, how it is measured, and how fonts and API data fit in (14) | Covered by D6-31 (approved structure; every figure provisional) |
| D6-55 | **Complete photo in every product-image placement:** product card, product-page main photo, product-page thumbnails, cart and staff-table thumbnails, and the vendor upload list. Each is a frame in which the whole photo is shown without cropping; space the photo does not fill shows the frame's `sunken` ground (12.1). The home hero is a separate element (12.4). Tested with real vendor photography in Stage 5 | Approved (9 Nov 2026) |
| D6-56 | **No product-card hover zoom.** D6-17 is withdrawn. Product cards have no hover animation and no other hover change (8.6, 13) | Approved (9 Nov 2026) |
| D6-57 | **The brand name is Dhaaga. The mark is a simple text-only wordmark and there is no separate logo.** The wordmark is the name set as text (12.3). This replaces the temporary wordmark of D6-30 | Approved (9 Nov 2026, Q6-3) |
| D6-58 | **The home hero is one static product cover photo from the marketplace catalogue.** It does not rotate, is not a carousel, and has no button until a suitable route exists (12.4) | Approved (9 Nov 2026, Q6-6) |
| D6-59 | **No separate "View full photo" control for now,** and no separate whole-photo preview in the vendor list: every frame already shows the complete photo (D6-55). It is revisited only if Stage 5 testing shows it is needed (12.1, Q6-8) | Approved (9 Nov 2026) |
| D6-60 | **Banners and featured lists on the home page are deferred** until the backend offers support for them (7.4; Document 5, D5-16, Q5-1) | Approved (9 Nov 2026) |
| D6-61 | **Hero details.** The hero photo is **chosen by the marketplace admin** from the catalogue and used only with **the vendor's confirmed permission** (D6-32). **Clicking the photo opens that product's detail page**; it is not a button and there is still no hero button (D6-58). A **higher-resolution rendition** is used when the frame needs it (the product detail carries a large one), **sized to the screen and kept light for slow connections**. How the admin's choice is stored is not decided (Q6-6, Document 7 T7-8) | Approved (9 Nov 2026) |
| D6-62 | **Generated garment illustrations are the stand-in images for the design stages.** No real vendor photos exist yet, so the visual pages use the generated illustrations (4:5 frames, complete picture). The complete-photo rule (D6-33, D6-55) is unchanged. **Testing with real vendor photos is not done and is not claimed**; it happens when real photos are available (Document 7, T7-7). Stage 5 is not held up by it | Approved (9 Nov 2026) |

**Decisions of 5 Nov 2026 not recorded as approved above, and what 9 Nov 2026 changed.** Decision C (5 Nov): whole-photo viewing was **not approved**. On 9 Nov the owner approved that every product-image placement shows the complete photo (D6-33, D6-55). A separate "View full photo" control and a vendor-list preview are **not added for now** (D6-59). The 4:5 ratio stays a direction to test with real photography (D6-62, T7-7). Decision J: the third-party scripts and analytics policy is **not settled here**; it is deferred to Document 7 (14.1, 19, 21). D6-17 (hover zoom), approved on 5 Nov, was withdrawn on 9 Nov (D6-56).

D-15 (rupees) and D-16 (IST) are applied in section 16. D-17 (WCAG 2.2 AA, where feasible, for the five customer journeys) is applied in section 11 as design targets.

## 3. Principles

1. **Cloth, not chrome.** The look comes from linen grounds, ink-dark text and one madder red, not from gradients, shadows or decoration. Product photos carry the colour.
2. **The accent means "do this".** Madder appears on the main action, links and the brand mark (and as the current-section bar in menus, 4.6), so a person can find the next step at a glance. It never means a problem.
3. **A state is never colour alone.** Every status and every error has an icon and words as well (D-17; Document 5, section 11).
4. **Warm in front, practical behind.** The storefront shows the stitch lines and generous space. Vendor and admin screens keep the same colours, type and components but cut decoration and use denser, calmer layouts.
5. **Two scripts, one voice.** English and Hindi get equal care: each script has its own sizes and spacing rules instead of one setting stretched over both.
6. **Light on a budget phone.** Two font families, vector icons, reserved image frames and no animation on load (section 14).

## 4. Colour

All colours below are tokens. A token is used for the role in its name, never picked by appearance.

### 4.1 Neutrals (the linen ground and ink)

| Token | Value | Role |
| --- | --- | --- |
| `surface` | `#FBFAF7` | Cards, panels, inputs, header, dialogs |
| `page` | `#F2F1EC` | The page background |
| `sunken` | `#E9E7DF` | Image frames while loading, skeletons, table headers, read-only and disabled fields, neutral chips |
| `line` | `#D9D6CB` | Decorative lines and dividers (not relied on to find a control) |
| `control` | `#7E7A6C` | Borders of inputs, checkboxes, radios and secondary buttons |
| `ink` | `#2B2C30` | Main text and headings |
| `ink-2` | `#46484E` | Secondary text, table headers |
| `muted` | `#5E6066` | Helper text, placeholders, struck-through old prices |

### 4.2 Brand: madder

| Token | Value | Role |
| --- | --- | --- |
| `madder` | `#9B2D30` | Primary button fill, links, brand mark, and the current-section bar in menus (a navigation-branding exception, 4.6 rule 3) |
| `madder-hover` | `#832528` | Hover on primary button and links |
| `madder-press` | `#6D1F22` | Pressed |

There is **no madder tint** (no pale pink background). A pale red fill is reserved for errors so the two cannot be mixed up. Madder stays the brand accent (D6-34); its pairs were rechecked (4.7).

### 4.3 Semantic colours (D6-02)

Each has a **text/icon** colour, a **fill** for banners and chips, and an **edge** for the box outline. Semantic colours are for status and feedback: system messages, status chips and form feedback. The single other use is the solid error fill on the confirm button of a destructive dialog (below).

| Meaning | Text and icon | Fill | Edge | Icon (always with text) |
| --- | --- | --- | --- | --- |
| Success | `#26683A` | `#E1EEDF` | `#8FBC95` | check |
| Warning | `#7C4A00` | `#FBEBC8` | `#D2A24A` | triangle with exclamation |
| Error | `#C0310F` | `#FDE6DF` | `#E08A73` | circle with exclamation |
| Information | `#1F5A8C` | `#E0EAF4` | `#8EB0D0` | circle with "i" |

- **Error solid** (`#C0310F` fill, white text; hover `#A52A0D`) is **permitted only for the confirm button of a destructive dialog**. This is a deliberate exception to "semantic colours are for status and feedback": the colour tells the person that the action cannot be undone, so it is allowed to appear on an action. It is used nowhere else (not on page buttons, links or banners).
- Semantic fills are never used as large page backgrounds.
- **Edges are decoration only.** The edge colours are below 3 to 1 on their grounds (4.7), so they are never the boundary of a control. A control that needs a semantic boundary uses the text colour (8.2, 9).

### 4.4 Sale (ochre)

| Token | Value | Role |
| --- | --- | --- |
| `sale` | `#E3A21A` | Solid fill of the "Sale" tag on a product image. Text on it is `ink` only: other text colours fall below 4.5 to 1 on it (for example `ink-2` 4.11) |

Ochre appears **only** as that solid tag. The tag carries the word "Sale" and no icon; it is not a status chip, so the icon-and-words rule for chips does not apply to it (4.7, 8.7). Warning uses a tinted box with an icon and never a solid fill, so the two stay apart. The percentage off is written in `ink` next to the price; it is not coloured.

### 4.5 Other tokens

| Token | Value | Role |
| --- | --- | --- |
| `scrim` | `#2B2C30` at 55% | Behind dialogs and sheets |
| Focus ring | 2 px `surface` halo inside, 2 px `ink` ring outside | Every focusable element (section 11) |

### 4.6 Usage rules

1. **Madder only for action, link and brand.** Never for a status, an error, a sale, a selection or a warning. The one other appearance is the current-section bar in menus (rule 3).
2. **Ink for selected controls and choices.** The chosen size, colour option, checkbox, radio, switch, active filter and current page number use `ink` (filled ink with `surface` text, or a 2 px ink border). This keeps selection visibly different from the madder action button.
3. **Current section in a menu (navigation-branding exception).** A 3 px `madder` bar on the left, `ink` text in weight 500, `sunken` fill. The bar is brand marking that tells people where they are in the site's navigation. It is **not a selected-control state** and does not follow rule 2: a selected control or choice (size, colour, checkbox, filter, page number, tab) never uses a madder bar. The current item is also marked in text for assistive technology, so the bar is never the only cue.
4. **Inline links are underlined.** Madder against ink text is only 1.87 to 1 (below the 3 to 1 needed to tell links apart by colour), so underline is the cue.
5. **Two reds never sit side by side as solid fills.** A destructive dialog uses a solid error confirm button (the permitted exception in 4.3) and no madder button.
6. **Form controls sit on `surface` or `page`**, not on `sunken`.
7. **Text on photos** always has its own `surface` plate (for example the "Out of stock" label); it is never placed directly on a photo.

### 4.7 Measured contrast

Ratios are WCAG 2.x relative-luminance contrast, calculated for these exact values. They are the pairs known at this stage, not a complete list of every pair a component will create (see "What still has to be checked" below). Required: **4.5 to 1** for normal text, **3 to 1** for large text and for the boundaries of controls and meaningful icons (WCAG 1.4.3 and 1.4.11).

| Pair | Ratio | Needs | Result |
| --- | --- | --- | --- |
| `ink` on `surface` / `page` / `sunken` | 13.36 / 12.33 / 11.26 | 4.5 | Pass |
| `ink-2` on `surface` / `page` / `sunken` | 8.76 / 8.08 / 7.38 | 4.5 | Pass |
| `muted` on `surface` / `page` / `sunken` | 6.02 / 5.56 / 5.08 | 4.5 | Pass |
| `control` border on `surface` / `page` | 4.12 / 3.80 | 3 | Pass |
| `control` border on `sunken` | 3.47 | 3 | Not used there (rule 6) |
| White on `madder` / `madder-hover` / `madder-press` | 7.47 / 9.29 / 11.23 | 4.5 | Pass |
| `madder` text on `surface` / `page` / `sunken` | 7.16 / 6.60 / 6.03 | 4.5 | Pass |
| Success text on its fill / on `surface` | 5.60 / 6.44 | 4.5 | Pass |
| Warning text on its fill / on `surface` | 6.28 / 7.09 | 4.5 | Pass |
| Error text on its fill / on `surface` | 4.76 / 5.46 | 4.5 | Pass |
| Information text on its fill / on `surface` | 5.95 / 6.94 | 4.5 | Pass |
| Semantic text on `sunken` (success, warning, error, information) | 5.43 / 5.98 / 4.60 / 5.85 | 4.5 | Pass |
| `ink` on `sale` | 6.28 | 4.5 | Pass |
| White on error solid / on error hover | 5.69 / 7.15 | 4.5 | Pass |
| White on `ink` (selected fill) | 13.95 | 4.5 | Pass |
| `ink` focus ring on `surface` / `page` | 13.36 / 12.33 | 3 | Pass |

**Semantic edges** (success 2.05, warning 2.23, error 2.50, information 2.17 on `surface`) and the **sale tag** (2.13 on `surface`, 1.97 on `page`) are below 3 to 1. The semantic edges are decorative outlines: the meaning of a banner or chip is carried by its icon and its words, which pass. **The sale tag has no icon.** Its meaning is carried by the readable word "Sale" (`ink` on `sale`, 6.28, which passes); the ochre shape is decoration and is not needed to understand it. No control's boundary uses these edges. **A field in error uses the error text colour (5.46) as its border.**

**Checked by a unit test (Slice 6a, 23 Nov 2026).** `tests/unit/contrast.test.ts` calculates every pair in this section from the colour values in `globals.css` and fails if a pair misses its ratio or no longer matches the figure recorded here. It found the `control` figures wrong: for `#7E7A6C` they are 4.12 on `surface`, 3.80 on `page` and 3.47 on `sunken`, not 3.49, 3.22 and 2.94. Every pair still passes, and `control` on `sunken` passes too, but rule 6 and the hover rule in 8.1 are kept as approved. The sale tag figure was for `surface`; on `page` it is 1.97. No colour and no rule changes.

**Rechecked on 9 Nov 2026 (D6-34).** The kept colours, including madder as the brand accent, were calculated again for the states that components use. **Three combinations fell below the required ratio and are corrected.** Every other combination calculated passes. These are calculated ratios for design targets, not a claim of conformance.

| Combination found below its ratio | Ratio | Needs | Correction |
| --- | --- | --- | --- |
| `control` border on `sunken`: an outlined control hovered with a `sunken` fill | 3.47 (first recorded as 2.94, corrected 23 Nov 2026) | 3 | An outlined control takes no `sunken` fill on hover; its border changes to `ink` (8.1). A `control` border still never sits on `sunken` (4.6 rule 6) |
| Error edge `#E08A73` as the border of the destructive button | 2.50 on `surface` | 3 | The border is the error text colour `#C0310F` (5.46 on `surface`, 5.04 on `page`) (8.2). The error edge stays decorative |
| Colour swatch boundary: a pale product colour on `surface` or `page` | Depends on the product colour | 3 | Every swatch carries a 1 px `control` outline (4.12 on `surface`, 3.80 on `page`) (8.5) |

| Other state combinations calculated | Ratio | Needs | Result |
| --- | --- | --- | --- |
| `ink` border (outlined control on hover) on `surface` / `page` | 13.36 / 12.33 | 3 | Pass |
| `ink` text on `sunken` (pressed outlined control, current menu item, menu item on hover) | 11.26 | 4.5 | Pass |
| `madder-hover` text on `surface` / `sunken` (links and Quiet button on hover) | 8.90 / 7.50 | 4.5 | Pass |
| Error text on `page` / `sunken` / its own fill (destructive button label, border and hover fill; error messages) | 5.04 / 4.60 / 4.76 | 4.5 (3 for the border) | Pass |
| `madder` text on the four semantic fills (a link inside a banner) | 6.13 to 6.34 | 4.5 | Pass |
| `surface` text on `ink` (selected chip, selected size) | 13.36 | 4.5 | Pass |
| `ink` text on `sale` (the only text colour used there) | 6.28 | 4.5 | Pass |

**What still has to be checked.** Every approved foreground and background combination must meet its ratio. The table above covers the token pairs; it does not cover the combinations that real components make. So:

- **Stage 4** checks each component in each state (default, hover, pressed, selected, disabled, error, read-only) on each ground it can sit on (`surface`, `page`, `sunken`): text, icon, border and fill, and the focus ring against the neighbouring colours.
- **Stage 5** checks the combinations that only appear on screens: chips on `sunken`, text plates on photographs, banners beside cards, and the focus ring on every ground used.
- A pair that fails is fixed by changing the token or the component, not by an exemption. The result of each check is recorded with the component or screen it belongs to.
- A disabled control is exempt from the contrast rule in WCAG but is still kept legible (`muted` on `sunken` is 5.08).
- Nothing in this document claims that these combinations have been achieved in a built product until those checks are done.

**How far apart madder and error are.** On the CIE76 colour-difference scale, madder to error is 29.0, to warning 36.0, to sale 66.0; error to warning is 39.8 and error to sale 53.4. Madder and error are both reddish, so colour difference alone is not relied on: madder is darker and browner, errors are brighter and orange-red, and the **rules in 4.6 keep them in different roles** (madder never carries a message; an error always has its icon and words).

## 5. Typography

### 5.1 Families

| Script | Family | Weights | Notes |
| --- | --- | --- | --- |
| Latin and all digits | Outfit | 400, 500, 600 | A soft geometric sans. Used for English text, prices, quantities, dates and the wordmark |
| Devanagari (Hindi) | Noto Sans Devanagari | 400, 500 | Used for Hindi text. Headings and emphasis use 500 |

Both are open-source (SIL Open Font License 1.1, from the published npm packages). Hindi pages use Outfit for digits and any Latin words, and Noto for the Devanagari text. Text shows in a fallback font while the fonts load, matched in size so it does not jump when they arrive (how this is done is a Document 7 matter, 14.1).

### 5.2 Scale

Sizes are in px with line height. The scale has **one step at 768 px**. This is a component threshold for type, separate from the layout breakpoints in 7.1 (7.1a explains why): the larger heading sizes are used from 768 px up so that a heading does not wrap into many short lines on a phone, and the smaller ones below that. Body text, small text and labels do not change. English uses the line heights shown; Hindi changes follow in 5.3. To be checked against real strings in Stage 4.

| Style | Below 768 px | 768 px and above | Weight | Used for |
| --- | --- | --- | --- | --- |
| Display | 36 / 42 | 56 / 60 | 500 | Storefront home hero only |
| H1 | 30 / 38 | 44 / 52 | 500 | Page titles (storefront); staff page titles use H2 |
| H2 | 24 / 32 | 30 / 38 | 500 | Section titles; staff page titles |
| H3 | 20 / 28 | 22 / 30 | 500 | Panel and card-group titles |
| H4 | 18 / 26 | 18 / 26 | 500 | Small headings |
| Body | 16 / 24 | 16 / 24 | 400 | Running text, inputs |
| Body small | 14 / 20 | 14 / 20 | 400 | Table cells, helper text, chips, product card titles |
| Caption | 12 / 16 | 12 / 16 | 400 | Image labels and legal notes only. Nothing else is smaller |
| Label | 14 / 20 | 14 / 20 | 500 | Field labels, buttons (16 on large buttons) |
| Price | 16 / 24 | 16 / 24 | 600 | Prices in lists. The product page price is 28 / 36 |

- Inputs are **16 px** so phones do not zoom in when one is focused.
- Headings use letter spacing of −0.01em in English only.
- Line length for running text is at most **72 characters**.
- All text can be enlarged to 200% without losing content (section 11).

### 5.3 Hindi

- **Line height:** body 28 (1.75), small text 22, headings 1.35 times the size at least. Devanagari marks above and below the line need the room.
- **Letter spacing: always 0.** Negative or positive spacing breaks joined letters.
- **Size:** body, small text, buttons and labels are the **same px size** as English. **Display and H1 are 85%** of the English size, H2 is 90%, because Hindi strings run longer (the preview hero went from 54 to 44 px).
- **Weight:** 400 and 500 only. No bold above 500, no italics, no upper-case, no justified text.
- **Digits and rupee sign:** from Outfit (D6-07), so a price reads the same in both languages.
- **Mixed text:** a Latin name inside Hindi text (a brand, a size code) keeps its own face with no size change.

### 5.4 Font loading and weight

Measured from the font files used in the Stage 1 preview (WOFF2, subsetted by script):

| Page language | Files | Size |
| --- | --- | --- |
| English | Outfit 400, 500, 600 | about 42 KB |
| Hindi | Noto Sans Devanagari 400, 500 and Outfit 400, 500, 600 | about 146 KB; about 124 KB with the Devanagari files trimmed (section 14, applied 14 Nov 2026) |

**Page language first, second script only when needed (D6-21).** A page requests the fonts for its own language. Font files for the **other** script are loaded only when text in that script is on the page, for example a vendor-written Hindi product title on an English page. They are not loaded on every page. Hindi pages already carry Outfit for digits and Latin words, so in practice only English pages can need a second family (Noto Sans Devanagari, about 104 KB for the 400 and 500 files together, about 84 KB trimmed; only the weights used). Until a font arrives, text shows in the fallback font with no invisible text and no layout jump. Vendor text in other scripts uses the system fallback and is not designed here. Document 7 specifies the mechanism and how it is made reliable (14.1). **Open (a validation item in section 14):** how an on-demand file counts against the budget is settled after measurement.

## 6. Space, shape and lines

### 6.1 Spacing

A 4 px base. Tokens: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. Common uses:

| Where | Value |
| --- | --- |
| Gap between related items (label and field, icon and text) | 4 to 8 |
| Gap between form fields | 20 |
| Card grid gap | 12 on compact, 20 on medium, 24 on expanded |
| Panel padding | 16 compact, 24 expanded |
| Space between page sections (storefront) | 48 compact, 72 expanded |
| Space between page sections (staff) | 24 |

### 6.2 Shape

| Token | Value | Used for |
| --- | --- | --- |
| `radius-1` | 2 px | Product images, cards, panels, tables |
| `radius-2` | 4 px | Buttons, inputs, chips, tags |
| `radius-3` | 8 px | Dialogs, sheets, menus |
| `radius-full` | round | Count bubble on the cart, avatar only |

Shadows are not used to separate surfaces; lines and the linen steps do that. The only shadow is one soft shadow under menus, dialogs and the floating hero swatches.

### 6.3 Stitch lines (D6-09)

A dashed line is the identity mark. It is **decoration**, so it is never the only cue for anything.

| Allowed on the storefront | Rule |
| --- | --- |
| Section dividers | 2 px dash in `line` |
| Under the header | 2 px dash in `line` |
| Frames around hero swatches and category tiles | 1 or 2 px dash, outside the photo edge |
| Empty-state boxes | 1 px dash in `control` |
| Footer top edge | 2 px dash in `line` |

- **Never drawn over a product photo.** A frame sits around a photo, not on it.
- **Vendor and admin:** only on (1) empty-state boxes and (2) a single line under the page title. Everything else uses solid 1 px `line` hairlines. **Tables never use dashes.**

### 6.4 Icons

- One line-icon family: 24 px grid, 1.75 px stroke, round ends and joins; shown at 16, 20 or 24 px.
- Icons are vector images (not photographs or bitmaps) and take the colour of the text next to them. How they are delivered is a Document 7 matter.
- An icon never stands alone for a status. An icon-only button has an accessible name and a hit area of at least 44 by 44 px on compact screens (8.1).
- Which icon set supplies them is decided in Document 7.

## 7. Layout and responsive rules

### 7.1 Breakpoints (D6-08)

| Name | Width | Gutter | What changes |
| --- | --- | --- | --- |
| Compact | below 640 px | 16 | One column; filters in a bottom sheet; menus in a drawer; no fixed bottom bars (D6-22) |
| Medium | 640 to 1023 px | 24 | Two or three columns; filters still in a sheet; staff side menu is a drawer |
| Expanded | 1024 px and above | 32 | Filter panel beside the grid; staff side menu always visible |
| Wide | 1280 px and above | 32 | Only the margins grow; content does not get wider than 1200 px |

- **Design width:** from 320 px (the smallest width WCAG reflow requires to work) up; checked at 360 and 390.
- **Storefront content** is at most 1200 px wide including gutters, centred.
- **Staff content** fills the space beside the side menu, with text blocks capped at 72 characters and forms capped at 640 px.
- Pages never scroll sideways, except a wide data table inside its own scrolling area between 768 and 1023 px (section 8.9).
- **Hover is not a breakpoint.** Whether hover styles apply depends on the device's ability to hover (8.1), not on screen width. A large touch screen gets no hover styles; a small window on a desktop with a mouse does.

### 7.1a Component thresholds

The three layout breakpoints decide the page structure. A few components change at a width of their own, because the component, not the page, is what runs out of room. These are listed here so they do not read as conflicts with 7.1. A component threshold never changes what the person can reach or do, only how it is drawn.

| Component | Threshold | Below | At and above | Why |
| --- | --- | --- | --- | --- |
| Type scale (5.2) | 768 px | Smaller display and heading sizes | Larger sizes | Large headings need width to avoid wrapping into short lines |
| Tables in vendor and admin (8.9) | 768 px | Each row becomes a stacked block | A table; from 768 to 1023 px it scrolls inside its own frame, with the first column kept in view | A table with a name, a status, several values and an action does not stay readable in under about 768 px. To be checked against real tables in Stage 4 and 5 |
| Staff side menu (7.3) | 1024 px | Drawer | Always visible | Same as the expanded breakpoint |
| Filter panel (8.8) | 1024 px | Bottom sheet | Panel beside the grid | Same as the expanded breakpoint |

768 px sits inside the medium range (640 to 1023 px) on purpose; it is not a fourth layout breakpoint, and no page layout changes there.

### 7.2 Grids

| Page | Compact | Medium | Expanded |
| --- | --- | --- | --- |
| Home: New arrivals row (D6-20) | 2 columns | 3 | 4 |
| Category, brand and search (with filters) | 2 columns | 3 | 3, filters at 264 px on the left |
| Home: category entries | 3 columns | 6 | 6 |
| Home: brand entries | 2 columns | 3 | 4 |
| Product page | Photo, then details | Photo, then details | Photo left (about 58%), details right and kept in view while scrolling |
| Cart | One list | One list | List with a summary column |
| Staff forms | One column | One column | One column, or two for short pairs (for example size and colour) |

### 7.3 Header and menus

**Storefront header** (Document 5, section 5)
- **Expanded:** the Dhaaga wordmark, search box, language switch, account menu, cart with line count; second row with the category links.
- **Compact:** menu button, wordmark, account, cart; search below on its own row. **The language switch is inside the navigation menu** (the drawer the menu button opens), as the first item under the close button, so it is one tap from the menu on every page. It is also in the footer at every size.
- The language switch shows the **other language's name in its own script** ("हिन्दी" on English pages, "English" on Hindi pages) as a text button with a globe icon, with a hit area of at least 44 by 44 px on compact.
- The header is **not fixed on compact screens**. It scrolls away, so it cannot cover content or a focused control. There are no sticky bars on the storefront (D6-22): the Add to cart button is part of the product page, and the cart is reached from the header.

**Vendor and admin shell**
- **Expanded:** a 232 px side menu on `surface` with a solid right-hand hairline, and a top bar with the area label, language switch and account.
- **Below 1024 px:** top bar with a menu button; the menu opens as a drawer from the left. The language switch moves into the drawer, above the list of screens, as on the storefront.
- The top bar shows the **area label with an icon**: "Vendor area" (shop icon) or "Admin area" (shield icon). "Admin area" was approved on 9 Nov 2026 (D6-37); it matches Document 5, which says "admin". A person who holds both roles also gets the section switcher (Document 5, section 4).
- The menu lists only screens the person can use (Document 5, section 5).

**Fixed elements on a compact screen (D6-22, D6-35).** No sticky cart summary, cart total or Add to cart bar is designed. The Add to cart button stays in its normal place on the product page. The only fixed elements are toasts (8.10), dialogs and sheets. Should the owner ever approve a fixed bar, these rules would apply to it as well. They are stated now so that toasts, dialogs and sheets are safe on their own:

- **Safe areas.** Fixed elements stay clear of the device's bottom and side safe areas (for example the home indicator and notches).
- **On-screen keyboard.** A fixed element never sits over a field the person is typing in; while the keyboard is open it moves above the keyboard or is hidden.
- **Focused controls.** A focused control is scrolled clear of any fixed element, so none hides it (WCAG 2.4.11). Banners and toasts never cover the action the person needs next.
- **Short or zoomed screens.** If a fixed element would take more than about a quarter of the visible height (landscape phones, 200% text size), it stops being fixed. The fraction is a starting value to check in Stage 4.

### 7.4 Storefront home (D6-20)

The home page has: the hero (12.4), **category entries**, **brand entries** and a **New arrivals** section. Page order and spacing are Stage 5 design work. Document 5 section 6.1 and D5-12 now describe the home the same way.

- **Category and brand entries** show names only. The backend sends a name and a slug for each and no image (`area-3a-catalogue.md`, brands and category tree), so entries are typographic tiles or links; no imagery or logo is assumed.
- **New arrivals** shows the newest products from the existing product list sorted by newest (`area-3a-catalogue.md`, product list, `sort=newest`). It uses the standard product card (8.6) and the grid in 7.2. Nothing is added to the cards: no "New" badge, rating, review, urgency or promotional line (17.1). The number of cards is set in Stage 5.
- **No "View all" link in this release (D6-36, approved 9 Nov 2026).** The approved routes are home, category, brand, product and search (Document 4, section 5). None lists all products newest first, and Document 5 describes the search page only as the result of a search, not as a page that opens with no search text. This document does not invent a route or a backend capability, so the section ends after its cards. If the owner later defines a destination (for example an "all products" route), a link can be added (21.1).
- **States:** loading uses card-shaped static skeletons (10); a failure shows "Try again" inside the section only, and the rest of the home stays usable (Document 5, section 3); if the catalogue returns no products the section is not shown (a proposal; an empty box on the home page would add nothing).
- Banners and featured lists are **deferred** until the backend offers support for them (D6-60; Document 5, D5-16, Q5-1).

## 8. Components

This section sets how each component family looks, sizes itself and responds in each state. The rendered library comes in Stage 4. The sizes, colours and rules here apply to all three areas unless a row says otherwise.

### 8.1 Interaction states (all components)

| State | Treatment |
| --- | --- |
| Default | As specified |
| Hover (only on devices with a hover-capable input) | Applies when the device has **any** input that can hover (a mouse or trackpad, including on a touchscreen laptop or tablet with one attached), not only when that is its primary input and never by screen width. On such hybrid devices touch still works, and nothing depends on hover. **Filled items:** one step darker fill. **Outlined items** (secondary button, controls with a `control` border): the border changes to `ink` and the fill does not change, so a `control` border never sits on `sunken` (4.7). **Borderless items with madder text** (Quiet button, links): the text goes to `madder-hover`. **Borderless items with `ink` text** (menu items): `sunken` fill. No movement or scaling |
| Pressed | **Filled items:** two steps darker. **Outlined items:** `sunken` fill with the `ink` border. **Borderless items:** `sunken` fill (madder text goes to `madder-press`). No movement |
| Focus | The focus ring (4.5); never removed |
| Selected | Ink fill or ink border (4.6 rule 2) |
| Current section in a menu | The madder bar, `ink` text and `sunken` fill: navigation branding, not a selected-control state (4.6 rule 3) |
| Disabled | `sunken` fill, muted text, no hover, shows a "not allowed" cursor. The reason is stated nearby in text when it is not obvious |
| Loading | The label changes to a progressive form ("Saving…"), a spinner replaces the icon (under reduced motion, a static "in progress" icon), the button keeps its width and is disabled (Document 5, section 3). **Disabled while busy keeps focus (owner, 23 Nov 2026):** a busy button, or the cart's quantity box while its change is on its way, looks disabled and cannot be pressed, but is marked `aria-disabled`, not `disabled`, because a browser drops focus from a control that becomes `disabled` and a keyboard or screen reader user would lose their place. A control unavailable for another reason (nothing chosen yet) is still `disabled` |
| Hit area (compact) | **Every standalone interactive control has a hit area of at least 44 by 44 px on compact screens**, including icon buttons, checkboxes, radios, switches, pager buttons, menu items, removable chips, the language switch, breadcrumbs, table-row name links, footer links, links standing alone on a line, and the "Clear all" button. A control may be drawn smaller if invisible padding makes the hit area meet this, and neighbouring hit areas do not overlap. **Inline text links** (a link within a sentence, paragraph or list item) may use the WCAG 2.5.8 inline exception, which covers targets in a sentence or whose size is limited by the line height of the surrounding text. They are not padded to 44 by 44 px because that would break the text layout (D6-27). The exception covers target size only: inline links still need their underline, contrast, focus ring and every other requirement, and the exception does not apply to a link that stands alone |
| Error | Error text colour, icon and message (section 9) |
| Read-only | `sunken` fill, no border, value in `ink`; shows as plain information |

### 8.2 Buttons

| Variant | Look | Use |
| --- | --- | --- |
| Primary | `madder` fill, white text | The one main action on a screen (Add to cart, Save, Send code) |
| Secondary | `surface` fill, 1 px `control` border, `ink` text; on hover the border is `ink` (8.1) | Other actions |
| Quiet | No fill or border, `madder` text, `madder-hover` text on hover | Low-priority actions (Cancel, Reset) |
| Destructive | `surface` fill, 1 px border in the error **text** colour `#C0310F` (not the paler error edge, 4.7), error text, with an icon; on hover the error fill `#FDE6DF` | Opens a confirmation (never acts on first press) |
| Destructive confirm | Error solid, white text | Only inside the confirmation dialog |

| Size | Height | Text | Used |
| --- | --- | --- | --- |
| Large | 52 | 16 / 500 | Storefront main actions |
| Default | 48 compact, 44 expanded | 16 / 500 | Forms and most buttons |
| Small | 36 drawn | 14 / 500 | Inline actions in staff tables. The hit area is at least 44 px high on compact screens (8.1) |

- **One primary button per screen section.** Two madder fills next to each other are not used.
- Labels say what happens ("Add to cart", "Save changes"), and keep the same verb in the result ("Saved").
- Horizontal padding 20 px; icon 20 px with 8 px gap. Full width on compact when it is the only action in a bar or form.
- Buttons that change data are disabled while a request runs (Document 5, section 3).

### 8.3 Text inputs

- Height 48 compact, 44 expanded; **40 in dense staff tables and filters on expanded screens only**; on compact the hit area is at least 44 px (8.1). Text 16 px. Border 1 px `control`, `surface` fill, `radius-2`.
- **Label above the field, always visible** (14 / 500, `ink`). Placeholders are examples only and are never the label.
- **Optional fields say "(optional)"** after the label; required fields carry no mark, since most are required.
- Helper text below in `muted` 14 px, tied to the field.
- Prefix and suffix (for example "+91") sit inside the border on `sunken`.
- Text areas: minimum 3 lines, resize vertically only, with a character count when the backend sets a limit (the limit comes from the API reference, not from this document).
- **One-time code field (D6-24):** one ordinary input field, not separate boxes. It accepts a full pasted code and the browser's or phone's automatic code fill, and its helper text says "6 digits" (the backend takes a 6-digit code and accepts up to 12 characters: `area-1-accounts.md`), so the field does not cut a pasted code short. This supports WCAG 3.3.8 (Accessible Authentication): no step needs the person to remember or retype a code they cannot paste.

### 8.4 Choice controls

| Control | Look |
| --- | --- |
| Checkbox | 24 px box, `control` border, checked = `ink` fill with a `surface` tick; label to the right; the whole row is the target and is at least 44 px high on compact |
| Radio | 24 px circle, checked = `ink` ring and dot; the whole row is the target, at least 44 px high on compact |
| Switch | 48 × 28 track inside a hit area of at least 48 × 44; on = `ink`, off = `control`; the label states what it controls, and the current state is also written ("On sale only: on") when it is not clear |
| Select | Looks like a text input with a chevron; list opens as a menu on expanded and a bottom sheet on compact |
| Size and colour pickers | See 8.5 |

### 8.5 Product option pickers (product page)

- **Size:** squares of at least 48 × 48 px with the size code in 16 / 500, `control` border; selected = `ink` fill; **unavailable** = struck through in text, dotted border, and the words "Unavailable" in the accessible name and shown on tap or hover. Never greyed out alone (Document 5, section 6.2).
- **Colour:** 40 px round swatch inside a 48 px target, a 1 px `control` outline on every swatch so a pale colour stays visible on `surface` and `page` (4.7), a 2 px `ink` ring when selected, and the colour **name written next to the choice** ("Colour: Indigo"). An unavailable colour has a diagonal strike and the word "Unavailable".
- **At the start (owner, 23 Nov 2026; Document 5, section 6.2):** the first colour in stock is selected; no size is, unless there is only one. "Add to cart" stays a normal Primary button while anything is in stock; with a size still to choose, the hint under it is its description, and pressing it moves focus to the first size that can be chosen.
- The catalogue's names for sizes and colours are shown as the backend sends them (D-09).
- A message under the pickers explains: "Unavailable sizes and colours are crossed out and cannot be picked." (sample wording).
- **Low stock** (a warning chip with its icon and the words "Low stock") appears near the pickers when the chosen variant is low, using the backend's per-variant flag and never a count.

### 8.6 Product card (storefront)

From top to bottom:

1. **Image frame**, 4:5, `radius-1`, `sunken` ground. The **complete product photo is shown without cropping** (D6-33): it is fitted inside the frame and centred, and any space it does not fill shows the `sunken` ground. While loading, the frame is `sunken` (section 12). A **sale tag** (ochre) sits at the top-left corner of the frame when the backend says there is a sale price.
2. **Title**, Body small 500, up to 2 lines, then an ellipsis.
3. **Vendor name**, Body small, `muted`, one line.
4. **Price line:** the price in Price style (`ink`), the old price struck through in `muted` only when the backend sends one (Document 5, section 3), then "32% off" in `ink` 500.
5. **Status:** the list tells a card only whether the product is in stock and on sale (`docs/api/api-contract.md`, section 8), so a card never shows a stock warning. An out-of-stock product shows the plate described below. A "Low stock" warning appears on the product page, where the backend gives it per variant.

| Card state | Treatment |
| --- | --- |
| Default | As above |
| Hover (only on devices with a hover-capable input) | **No change** (D6-56): no zoom, underline, colour change, lift or movement. The focus ring is unaffected. Nothing depends on hover |
| Focus | Focus ring around the whole card (it is one link) |
| Out of stock | The photo is dimmed to 60%; a plate with "Out of stock" (`ink` on `surface`) sits across the bottom of the photo; title and price remain and the card still opens the product |
| Image missing or failed | Placeholder (section 12) |

**Complete photo (D6-33, D6-55).** Portrait photos fill the frame; landscape and square photos leave `sunken` space above and below. Whether this looks right with real vendor photography is tested when real photography exists (D6-62, Document 7 T7-7); if it does not, the owner decides on a change then. The Stage 5 screens were approved with generated stand-in illustrations (12.1).

Wording follows the backend's stock state and is never worked out from a number on screen (Document 5, section 3). The Stage 1 preview showed "Only 3 left" on a card; that was sample text and is corrected in Stage 4 (section 20).

**Hover and touch (D6-56).** A product card has no hover animation, so a device that can hover and one that cannot show the same card. Nothing is revealed, shown or reachable only on hover.

### 8.7 Chips, tags and status

A chip is 28 px high, `radius-2`, Body small 500, with a 16 px icon, a fill and text from the semantic table. **Every chip has an icon and words.**

| Tone | Used for |
| --- | --- |
| Neutral (`sunken` fill, `ink-2` text) | Draft, unpublished, "View only", no-state labels |
| Information | Submitted or in review, waiting for someone |
| Success | Approved, active, in stock |
| Warning | Low stock, needs attention |
| Error | Rejected, suspended, out of stock for staff, failed |
| Sale (ochre tag; not a chip: the word "Sale", no icon) | Price offers on product images only |

| Status (from Document 5) | Chip |
| --- | --- |
| Product: draft | Neutral, list icon, "Draft" |
| Product: submitted | Information, clock icon, "In review" |
| Product: approved | Success, check, "Approved" |
| Product: rejected | Error, cross, "Rejected" |
| Product: unpublished | Neutral, eye-off icon, "Unpublished" |
| Vendor: draft / submitted / approved / rejected / suspended | Neutral / Information / Success / Error / Error |
| Stock: in stock / low / out (staff screens) | Success / Warning / Error |
| Stock: out (customer screens) | The neutral "Out of stock" plate, not an error |
| Access: read-only role | Neutral outlined, eye icon, "View only", beside the page title (Document 5, section 8.3) |

Status names are shown with the frontend's own English and Hindi words (D-08, D-09), not the backend's raw values. Statuses not listed here (coupons, sales, imports) follow the same tone rules; each screen design names its own mapping.

### 8.8 Filters, sort and "Load more"

- **Filter panel (expanded):** 264 px, solid hairlines between groups, each group 16 px type for its title; checkboxes with counts when the backend sends them. A "Clear all" quiet button at the top when any filter is on.
- **Filter sheet (compact and medium):** opens from a "Filters" button showing the number of active filters; a full-height bottom sheet with a "Show 128 results" button at the foot of the sheet itself (part of the sheet, not a bar on the page).
- **Active filters** are also shown as removable chips above the grid (selected chips use `ink` fill).
- **Load more** (D5-03): a Secondary large button, with the text "Showing 8 of 128" and a thin progress line (`line` track, `ink` fill) above it. After loading, focus stays where it was and the added count is announced (Document 5, section 6.1). When the last batch has loaded and the button is gone, focus moves to the first card added, so a keyboard or screen-reader user goes on from the new products instead of starting again at the top of the page (owner, 14 Nov 2026).

### 8.9 Tables (vendor and admin)

- Header row on `sunken`, Body small 500 in `ink-2`; rows 56 px (48 in dense lists), separated by **solid 1 px `line`** hairlines; no vertical lines, no dashes.
- Product rows carry a 40 px photo. Numbers and prices are right-aligned. A row's name is the link. Row hover (only on devices with a hover-capable input) uses `page` fill.
- Numbered pages (D5-03): a row of buttons drawn 40 px high (hit area at least 44 px on compact), current page `ink` fill, "Page 1 of 6" beside it and the total shown. No export action (D5-11).
- **Below 768 px (D6-10, a component threshold, 7.1a)** each row becomes a stacked block: name and status first, then label-and-value lines. Tables never scroll sideways below 768 px.
- **Between 768 and 1023 px** a table wider than the space scrolls inside its own frame, with the first column kept in view.

### 8.10 Dialogs, sheets, menus and messages

| Component | Look |
| --- | --- |
| Dialog | Centred, up to 480 px wide, `radius-3`, `surface`, shadow, `scrim` behind. Title H3, text Body, buttons on the right (expanded) or full width stacked (compact) |
| Bottom sheet (compact) | Slides up from the screen edge over 200 ms (one of two exceptions to the 16 px limit in 13, with side drawers), `radius-3` on top corners, a close button, maximum 90% of the screen height |
| Menu | `surface`, 1 px `control` border, `radius-3`, shadow, items 44 px high |
| Confirmation | States what will happen in plain words and names the thing ("Remove 2 unavailable items from your cart?"). Buttons: "Cancel" and the verb ("Remove") |
| Banner | Full-width box in a semantic fill with icon and text; may carry one action. The cart note "Checkout is coming soon. Your cart is saved." (D5-02) is an Information banner with no action |
| Toast (D6-23) | Bottom on compact (above the keyboard and safe area, 7.3), bottom-left on expanded. **Success** ("Saved"): visible for 6 seconds; announced to assistive technology as a status message; a Dismiss button with a 44 px hit area; the timer pauses while the toast is hovered, focused or touched, and a touch on the toast holds it until dismissed. **Error:** stays until the person dismisses it or the problem is resolved (for example a retry works); it never leaves on its own; announced immediately. Nothing depends on hover: pause and dismiss work by touch, keyboard and pointer. A form error is **never only in a toast** (it is in the summary, 9), and what a success toast says is also visible on the updated screen |

### 8.11 Navigation parts

- **Breadcrumbs:** Body small, `muted` links separated by a chevron icon, current page in `ink`; on compact they show only the parent with a back arrow (hit area at least 44 px).
- **Tabs** (if a screen needs them): text tabs with a 3 px `ink` underline for the current one; they are not used for navigation between sections (that is the side menu).
- **Search box:** same as a text input with a search icon; suggestions list appears as a menu under it.

## 9. Forms and validation feedback

This applies Document 5, sections 9 and 10, visually.

- **Where errors show.** Each field error sits **directly under its field**: the error icon, then the message in error text colour (Body small), and the field's border becomes 2 px error colour. The field is never shown in error by colour alone.
- **Summary.** After a failed submit, an error banner at the top of the form lists the errors as links to each field. Heading wording is like "Fix 2 things to continue" (sample wording; final text is in the message catalogue, D-08, D-09). Focus moves to it. Errors that belong to no field appear only there. An error for a field the screen does not have also appears here, as an entry without a link, with the frontend's general wording (Document 5, section 10).
- **When to check (D6-25, approved).** A field is checked when the person leaves it. A first-time error is never shown while the person is still typing in that field. An error clears as soon as the value becomes valid, even while typing. The whole form is checked again on submit, and any failure goes to the summary. Only cheap, certain checks run in the frontend (a missing value, a wrong shape); rules about content are the backend's, and a backend rejection shows as an ordinary field error (Document 5, section 10).
- **Success.** No green ticks on fields. Success is shown after the save (a success toast, 8.10, and the updated screen).
- **Messages** are the frontend's own for each code, in English and Hindi, with a plain next step, in the interface's voice, never apologising and never blaming ("Enter a 6-digit pin code."; the backend requires exactly six digits, `area-1-accounts.md`).
- **Restore offer** (D5-05): an Information banner at the top of the form: "We kept your unsaved changes. Restore them?" with a primary "Restore" button and a quiet "Discard" button. When the server has newer data, the banner says so and a comparison follows (two columns on expanded, stacked on compact; the person's copy and the server version). The person can choose **per field**, or choose **"Keep all mine"** or **"Keep all server version"** for the whole form (Document 5, section 9). Nothing is overwritten until a choice is made.
- **When a restore offer and an error summary are both on the form.** The error summary is above the restore offer, because it follows an action the person just took. The restore offer is announced as a status when the form opens but does not take focus, so typing is not interrupted. After a failed submit, focus goes to the summary, as in the rule above. Answering the offer moves focus to the first field it changed ("Discard": the first field).
- **Saving while a restore offer is still unanswered (D6-39, approved 9 Nov 2026).** The existing recovery rules stay: nothing is overwritten silently, the person answers by Restore, Discard or the comparison, and the saved copy is cleared on a successful save. The approved rule for the one case they leave open:
  1. Pressing save sends exactly what is on the screen. The unanswered copy is **never merged in silently**.
  2. Before sending, a confirmation dialog (8.10) says: "You have earlier changes you have not restored. Save without them?" with the buttons "Go back" and "Save without them". Neither button is chosen for the person; nothing is sent until they choose.
  3. **"Go back":** nothing is sent, the offer and the saved copy both stay, and focus returns to the offer.
  4. **"Save without them":** the save runs and sends **only the values currently on the screen**. **On success** the offer is dismissed and the old saved copy is cleared, as in Document 5 section 9 (the person was told and chose). **On failure** (a validation or backend error) nothing is cleared: the offer and the saved copy both stay, and the error summary shows as usual.
  5. If the offer has been answered (Restore or Discard) there is no confirmation.
  The owner approved this behaviour on 9 Nov 2026. It is written into Document 5 section 9 (D5-13).
- **Sections of long forms** (the product form and the vendor application) show their step with text, not a coloured bar only, and each step shows whether it is complete using an icon and words. Samples that match Document 5: the vendor application has four steps ("Step 2 of 4: Pickup address"); the product form has five ("Step 3 of 5: Variants"). The step names and counts are Document 5's (sections 7.1 and 7.3).
- **Uploads** (photos, documents; vendor screens): a drop area drawn with a **solid 1 px `control` border**, not a stitch line (6.3 allows stitch lines in vendor and admin only on empty-state boxes and under the page title), with a plain file button beside it (Document 5, section 7.3); a visible file list with name, size and a remove button; for photos, up and down buttons as well as dragging for the order (Document 5, section 7.3; this also meets WCAG 2.5.7 Dragging Movements); a progress line with text; and the failure reason in text. Photos are never kept in the recovery copy (Document 5, section 9).

## 10. Loading, empty, error and no-access states

Document 5 (section 3) gives every screen four base states: **Loading, Empty, Error and No access**. Error has two scopes, the whole screen and one part. The remaining rows describe **additional states and outcomes** that only some screens have (partial failure, view only, outcome unknown and so on). Visual treatment of each:

| State | Treatment |
| --- | --- |
| **Loading** | A skeleton with the **same size and shape as the content** (4:5 frames, text lines, table rows) in `sunken`. **Skeletons are static: no sweep, pulse or shimmer.** A repeating sweep was in the first draft and is removed; it adds motion for little benefit, and a still skeleton already shows where content will appear. Assistive technology is told "Loading" with a status message. A spinner alone is never the loading state. Content never shifts when it arrives |
| **Empty** | A 1 px dashed `control` box (storefront and staff), a 32 px line icon, a title that says why it is empty, one sentence, and one action |
| **Error (whole screen)** | A centred block: error icon, what failed, a "Try again" primary button, and the request ID **only when the backend reliably provides one to the screen** (D6-38), with a quiet "Copy" button beside it. Document 5 (section 3, D5-14) says the same. The backend's id reaches the browser (V5-5, closed 11 Nov 2026); no screen depends on it: with no reliable id, the message appears without the id and without the button |
| **Error (one part)** | The error box with "Try again" **inside that part only**; the rest of the screen stays usable |
| **No access** | A real 403 page for a wrong role: lock icon, what the person cannot open, and a way back. A person with no session is sent to login instead (Document 2) |
| **Partial failure** | As "Error (one part)" |
| **View only** | The "View only" chip beside the page title, and no change buttons (Document 5, section 8.3) |
| **Outcome unknown** (Document 5, section 3) | A Warning banner says the change may or may not have been saved and offers "Refresh". The action is not repeated automatically. For a photo upload whose outcome is unknown, an Information line says the screen is checking whether the photo arrived, then "Retry" appears only if it did not (Document 5, section 7.3) |
| **Vendor cannot change things** (Document 5, section 7.5) | One banner at the top; its tone follows the vendor status chip (8.7). Change actions are hidden |
| **Newer data, or changed meanwhile** (Document 5, section 9; moderation conflicts, V5-4) | A Warning banner says the record changed, the latest data is shown, and the field comparison from section 9 helps the person decide. Document 5 section 9 describes this for a restored copy; the moderation case (`REVIEW_STALE`) is the only stale-write check the backend has (V5-4), so no other screen claims to prevent lost updates |
| **Bulk stock update failed** (Document 5, section 11) | An Error banner says nothing was changed, with a table of the failing rows by position, SKU and reason. Success: a Success banner with the number of variants changed |
| **CSV import result** (Document 5, sections 7.3 and 11) | Before confirm, an Information line says nothing has been created. After confirm, one row per product: Success "Created" or Neutral "Skipped" with the reason, and the original line number |

The rows after "No access" are additional states, not extra base states. The five rows after "View only" fix tone and structure only; their layouts are Stage 4 and Stage 5 work. Document 5 treatments (for example the grey styling of cart line problems) are not changed by this table.

Samples of wording (final text is in the message catalogue):
- Empty coupon requests: "No coupon requests yet" with "Ask for a coupon".
- Part failure: "The stock summary could not be loaded." with "Try again".

## 11. Accessibility (D-17)

D-17 sets **WCAG 2.2 level AA, where feasible, as the formal target for the five customer journeys** in Document 5, section 11. The vendor journey (apply, add a product with photos, set stock) is an **additional aim**, not part of that formal target. The rules below are **design targets**, applied to all screens through the shared components so the work is done once and not screen by screen. They are meant to make the target reachable; they do not show that it has been reached. That is established by the Stage 4 and Stage 5 checks and by implementation and testing; the test routine is in Document 7.

| Area | Rule in this design system |
| --- | --- |
| Colour contrast (1.4.3, 1.4.11) | Target: 4.5 to 1 for text and 3 to 1 for control borders, focus rings and meaningful icons. The pairs in 4.7 reach these when calculated, including the component states rechecked on 9 Nov 2026; every other combination a component or screen makes is checked in Stage 4 and 5 (4.7) |
| Colour alone (1.4.1) | Status, errors, selection, unavailable options and links each have an icon, text, underline or shape in addition to colour (sections 4.6, 8.5, 8.7) |
| Focus visible (2.4.7) | Target: a focus ring of a 2 px `surface` halo plus a 2 px `ink` ring on every focusable element, never removed. Visibility against each ground it appears on (`surface`, `page`, `sunken`, photographs, the scrim) is verified in Stages 4 and 5 (4.7) |
| Focus not obscured (2.4.11, AA) | Target: a focused control is not entirely hidden by author-made content. The header does not stay fixed on compact screens; there are no sticky bars (D6-22); toasts and other fixed elements follow the rules in 7.3; dialogs trap focus and return it on close |
| Target size (2.5.8, AA) | WCAG asks for 24 by 24 CSS px at least. This system targets a hit area of **44 by 44 px** for every **standalone** interactive control on compact screens (D6-11, 8.1), whatever size it is drawn; small staff buttons are drawn 36 px high on expanded screens, above the WCAG minimum. **Inline text links** use the 2.5.8 inline exception (D6-27); it covers target size only and does not excuse any other requirement. Standalone links, footer and menu links, and breadcrumbs keep 44 px |
| Accessible authentication (3.3.8, AA) | Target: the one-time code field accepts paste and automatic code fill; the login screens have no puzzle or memory test |
| Reflow and zoom | Target: layouts work at 320 px wide and at 200% text size without sideways scrolling (except a table in its own frame) |
| Text spacing | Containers grow with the text; fixed-height text boxes are not used |
| Language | Each page declares its language; a phrase in the other language (for example the language switch) declares its own |
| Forms | Visible labels, helper and error text tied to the field, error summary that takes focus (Document 5, section 10) |
| Motion | No motion on load; skeletons are static; hover and press changes are colour only; all non-essential motion, including the button spinner, is replaced by a still alternative when the person prefers reduced motion (section 13). Nothing depends on hover |
| Content on hover or focus (1.4.13, AA) | Anything that appears on hover also appears on focus and on tap, can be dismissed, and stays while the pointer is over it. Full timestamps follow this (16) |
| Forced colours / high contrast | Borders, rings and icons carry meaning; shadows and fills never do |
| Images | Alt text from the vendor where there is one, otherwise the product title; decorative images have none (section 12) |
| Status messages (4.1.3, AA) | Success toasts, the cart count after adding, the number added by "Load more", the restore offer and in-page progress are announced as status messages; errors are announced immediately (8.10, 9) |
| Timing (2.2.1) | Success toasts last 6 seconds and can be paused or dismissed by touch, keyboard and pointer; error toasts do not time out (D6-23) |
| Redundant entry (3.3.7) and dragging (2.5.7) | A person is not asked to re-enter details the screen already holds (for example the address on the account screen); photo reorder has up and down buttons as well as dragging (Document 5, section 7.3). Whether other flows need more is checked in Document 7's test routine |

**This list is not exhaustive.** It names the criteria this document can act on. The full set for WCAG 2.2 AA, and how each is tested, are Document 7 matters.

## 12. Imagery

### 12.1 Product images

**What the backend numbers mean.** The figures below are **quoted for design context. The backend documentation is authoritative (D6-26)**; if they differ or change, the backend wins and this section is corrected. Three different numbers appear there. They describe different things and are not combined into one rule here:

| Number | What it is | Source |
| --- | --- | --- |
| **At least 500 px on the shorter side** | An **upload check on the vendor's original file**. A smaller file is refused with `IMAGE_INVALID`. It is not the size of any stored rendition | `docs/api/reference/area-3b-products.md`, photo upload (limits and the "too small" example); `docs/design/area-design-specs.md`, Area 3, image pipeline, step 2 |
| **JPEG, PNG or WebP; up to 10 MB; up to 40 million pixels; up to 8 photos per product** | The other upload checks | Same |
| **thumb 300 px, medium 800 px, large 1600 px on the longest side** | The **largest length of the longest side** of each stored WebP rendition. A smaller original is **never enlarged**, so a rendition can be smaller than its cap | `area-design-specs.md`, image pipeline, step 4; `docs/testing/swagger-test-guide.md`, section 9 |

So a 1200 × 900 original gives a thumb of 300 × 225 (`swagger-test-guide.md`, 9.5). A portrait 1000 × 1250 original gives a thumb of 240 × 300. The 300 px and the 500 px therefore do not conflict: one limits the size of what is stored, the other limits what may be uploaded. Each product holds up to 8 photos, and each photo has an optional alt text of up to 200 characters.

**What this means for the design.** The pipeline lists no aspect-ratio check, so photos arrive in any shape and **rendition dimensions are not fixed**. The frontend frames them (below), never assumes a rendition is a particular width or height, and reserves space by ratio.

| Place | Frame | Rendition |
| --- | --- | --- |
| Product card | 4:5, the complete photo without cropping (D6-33), `sunken` ground behind it, `radius-1` | medium |
| Product page main photo | 4:5 frame, the complete photo without cropping (D6-55) | medium on compact, large on expanded |
| Product page thumbnails | 4:5, 64 px wide, the complete photo (D6-55) | thumb |
| "View full photo" control **(not added for now, D6-59)** | Not part of the design. Proposed earlier: the whole photo opened from the main photo. Every frame already shows the complete photo. Revisited only if Stage 5 testing shows it is needed | large |
| Staff table and cart line | 1:1 or 4:5, 40 to 72 px, the complete photo (D6-55) | thumb |
| Vendor upload list | 4:5, 96 px wide, the complete photo (D6-55). Document 5 specifies the list, not its crop. No separate whole-photo preview is added (D6-59) | thumb |

- **The 4:5 frame is a direction, not a proven choice.** Every product-image placement shows the complete photo (D6-55). It **must be tested with real vendor photography once it exists** (D6-62, Document 7 T7-7): landscape and square photos sit in a 4:5 frame with `sunken` space above and below, and the test shows whether that is acceptable. If it is not, the owner decides on a change (for example a different ratio) then. No real photo has been tested; the Stage 5 screens used generated stand-in illustrations.
- **Fit.** In every placement the photo is fitted inside its frame, centred, and never cropped. The `sunken` space is part of the frame and carries no text, tag or dash except as in the last bullet below.
- **No "View full photo" control for now (D6-59).** Every frame shows the complete photo, so no control is added. Testing with real vendor photography (T7-7) can show that one is needed; only then is it revisited. The alt text describes the whole photo in every case (12.2).
- **Frames are reserved** at their final size, so images arriving do not move the page (section 14).
- **Loading:** `sunken` fill. **Missing or failed:** a simple garment silhouette line icon on `sunken` with "Photo unavailable" in Caption. Product photos never carry a placeholder label in the live site; the "Placeholder image" label exists only in design previews.
- **Guidance to vendors** (Stage 5): photos shot upright at about 4:5 fill the card frame best. This is advice only; any shape the backend accepts is shown.
- **Never** place text, tags or dashes over a photo except the ochre sale tag and the "Out of stock" plate.

**Not settled by the sources.** (1) The backend documentation reviewed does not say whether the width and height of each rendition are sent to the client, so frames are reserved by ratio. (2) A photo that only just passes the 500 px check will look soft when shown large on an expanded product page; whether the minimum should be higher is a backend question and this document does not change it. (3) Whether real vendor photography looks right in a 4:5 frame with the complete photo is not known until Stage 5.

### 12.2 Alt text

Product photos use the vendor's alt text when there is one, otherwise the product title with the position ("Block-print cotton kurta, photo 2 of 4"). Photos beside text that already says the same thing have empty alt text.

### 12.3 Brand mark

The brand name is **Dhaaga** (D6-57, approved 9 Nov 2026). The mark is a **simple text-only wordmark**; there is no separate logo and none is designed. The details below are approved with this document:

- The name is set as ordinary text in Outfit 600, in `ink`, on light bars, and is a text link to the home page. It needs no image file, so it adds nothing to the downloads in section 14.
- Its slot is 28 px high on expanded and 24 px on compact.
- No symbol or decorative mark is drawn for it, and none is added later without a new decision.
- The text is the name as written, "Dhaaga", in both languages. The name's Hindi form, if wanted, is not decided here.

### 12.4 Home hero (D6-14, D6-15)

**Photography leads (D6-15, D6-32, D6-58).** The hero shows **one static product cover photo from the marketplace catalogue**, and it must be genuine fashion photography whose usage permission is confirmed: garments worn or laid out in real light. The garment illustrations in the Stage 1 previews are development stand-ins so layouts can be checked; they are acceptable during development and are not the final look. **No third-party or stock photography is used without confirmed rights.** The hero is not signed off until it has been seen with a real catalogue photograph whose permission is confirmed.

| Part | Rule |
| --- | --- |
| Layout | Expanded: text on the page ground on the left, the photograph in a frame on the right (4:5 portrait, up to 520 px wide). Compact: headline first, then the photograph full width at 4:5. **Text is never placed over the photograph** (4.6, rule 7), so any photograph works without a darkening layer |
| Frame | `radius-1`, with the stitch-line frame around it, not on it (6.3) |
| Photograph | **One static photograph** (D6-58): the cover photo of one product from the catalogue. No carousel, no rotation, no pair of images. It shows the complete photo as in D6-55. It is the page's most important image, with its space reserved (section 14). Its alt text follows 12.2 |
| Headline | Says plainly what the person can do or find, using only statements the marketplace can support (17.1). It is the one place a heading may be a full sentence. **Neutral example only:** "Browse new arrivals". The final line is written by the owner under the claims rule. Lines such as "made by hand" or "from makers across India" are not used unless the marketplace can show they are true |
| Action | **No button** in this release (D6-58). A button is added only when a suitable route exists and the owner decides on it. The label would then be written by the owner under the claims rule |
| Facts | **None are added for design.** A number, price or date appears in the hero only when the catalogue provides a real one and it is useful (for example the number of products in a category, which the catalogue gives). Otherwise the hero has no fact. The claims rule in 17.1 applies to every word of the hero |
| Fallback | If no photograph is available, the hero shows a text-only layout on `sunken`, with no illustration and no empty frame |

**Where the photograph comes from (D6-58).** It is the cover photo of one real product from the catalogue (`docs/api/reference/area-3a-catalogue.md`, product list: each product carries a cover address, and the list can be sorted by newest). No new backend feature is needed. **Still open:** (1) which product, and who or what chooses it, which is a Stage 5 and Document 7 matter; (2) whether the vendor's terms allow a vendor's cover photo to be used as the hero, because usage permission must be confirmed first (D6-32); (3) whether the medium cover rendition in the list (800 px on the longest side) is sharp enough at up to 520 px wide on high-density screens, which Stage 5 checks, and which would otherwise need a larger rendition (the product detail carries a large one); (4) how the admin's choice is stored and edited: the backend has no feature for it and none is added (D-14), so this is open (Document 7, T7-8). **Decided (D6-61):** the photo is chosen by the marketplace admin, used only with the vendor's confirmed permission, links to that product's detail page when clicked, and uses a larger rendition sized to the screen when the medium one is not sharp enough. Until the choice can be stored, the hero shows the text-only fallback.

## 13. Motion

- Nothing moves on page load.
- Press and hover change colour only, within 120 ms. Hover applies when the device has any input that can hover, whatever its screen width or primary input (8.1). Product cards have no hover animation (D6-56).
- **No card lift, tilt, parallax, carousels or timed rotation.**
- Menus, accordions and dialogs open and close with a 200 ms fade or a short slide of at most 16 px, and show what changed. **Bottom sheets and side drawers are the one exception:** they slide in from their edge over 200 ms, because they come from outside the screen. Under reduced motion they appear instantly.
- **Skeletons are static** (section 10). The only repeating motion is the small spinner inside a button while a request runs.
- When the person prefers reduced motion, every slide and the spinner are replaced by an instant change, a still icon or nothing. This holds throughout the product, not only in the places named here.
- No interaction needs hover. Anything shown on hover is also shown on focus and on tap, and is not needed to use the screen.

## 14. Performance (D-11, D6-12, D6-31)

D-11 makes budget Android phones and slow connections the reference case and leaves the targets to this document. On 9 Nov 2026 the owner approved **practical performance targets for the storefront, vendor and admin areas (D6-31)**. They are **targets, not measurements and not guaranteed results**: no page exists yet. **Every figure in this section is provisional until it has been validated technically in Document 7 and the first working build, on the agreed budget-device and slow-connection profiles. No validation has been done.** The labels show where each figure came from, not that it is confirmed:

- **Google threshold:** Google's published "good" value.
- **Retained:** an existing provisional target, kept as it was.
- **Proposed, needs validation:** a starting value set for this approval. It must be validated technically (by measuring real API responses and the first build, in Document 7's test matrix) before anyone treats it as a requirement.

**How the targets are tested.** Lab tests use a **budget Android phone profile on a slow 4G connection** (this project's choice), and the main customer journeys are repeated on a slower connection, so the slowest realistic case is seen and not only the typical one. When field data exists it is read at the 75th percentile of mobile visits (Google's method). The exact devices and network settings are pinned in Document 7's test matrix. **Final confirmation depends on measurements from the first real implementation**; until then the numbers below stand and are not changed.

**Targets for all three areas**

| Target | Value | Label |
| --- | --- | --- |
| Largest Contentful Paint | 2.5 seconds or less | Google threshold (web.dev, "Web Vitals"); retained |
| Interaction to Next Paint | 200 milliseconds or less | Google threshold; retained |
| Cumulative Layout Shift | 0.1 or less | Google threshold; retained |

**Page-size budgets by area.** All sizes are transferred bytes, after compression, on a first visit with an empty cache; fonts are inside the initial total.

| Area | Initial load (document, styles, scripts, fonts, interface graphics) | Fonts | First-screen API data | Label |
| --- | --- | --- | --- | --- |
| Storefront | 300 KB | 150 KB per page language (English about 42 KB, Hindi about 146 KB, 5.4) | 100 KB for the data requests the first screen needs (for example the New arrivals list or the first page of a category) | 300 KB and 150 KB retained; 100 KB proposed, needs validation |
| Vendor | 300 KB | Same fonts and limit | 100 KB for the data requests the first screen needs (for example the first page of a list) | All proposed, needs validation |
| Admin | 300 KB | Same fonts and limit | 100 KB, as for vendor | All proposed, needs validation |

- Staff screens share the colours, type and components of the storefront (D6-29), so the same initial figure is the starting point. They also carry tables, forms and uploads, so the first build may show that 300 KB is too tight or too generous for them; the owner then decides, and the figure is not changed silently.
- **Later requests** ("Load more", the next table page) are not part of the initial load. Each response is judged by Interaction to Next Paint and by the same 100 KB starting value (needs validation).
- **Photos** are not counted in these budgets. Storefront photographs follow the image rules below; vendor uploads follow the backend limits (12.1).
- **Staff screens that wait for data:** Largest Contentful Paint is judged when the main list or table first appears, not when the empty shell does (needs validation).

**What the initial-load budget means (every figure stays provisional).**

| Question | Answer |
| --- | --- |
| What is counted | The bytes the browser downloads for a first visit to a page: the page document, its stylesheets and scripts, the fonts for the page language, and interface graphics (icons; the wordmark is text, 12.3) |
| What is not counted | Product photographs and hero photographs (the image rules below), and API data responses, which have their own column in the table above |
| Compressed or not | **Measured as transferred, after compression** (as the server sends it), not after unpacking |
| Cold or warm | First visit with an empty cache. Later visits are expected to be lighter |
| Fonts and the total | Fonts for the page language are **inside** the 300 KB, not on top of it. English fonts (about 42 KB) leave about 258 KB for everything else. Hindi fonts (about 146 KB) leave about 154 KB, so the Hindi pages have much less room for code and styles. A second-script font loaded on demand (5.4, D6-21) is not counted in these figures; how it is counted is settled after measurement. **Since 14 Nov 2026 the limit is split** (below): 258 KB without fonts in every language and fonts on their own, so Hindi pages are no longer squeezed into 154 KB |
| The 150 KB font limit | A limit within the total: no page language loads more than 150 KB of fonts |

**The budget for Hindi pages (owner, 14 Nov 2026; applied the same day, after the owner reviewed the Q7-7 measurements in Document 7, pull request #49).** It replaces the single 300 KB total above for the initial load: A Hindi page needs Noto Sans Devanagari as well as Outfit, so its fonts are about 100 KB more than an English page's while its code is the same. With fonts inside one 300 KB total, a Hindi page would need about 100 KB less code than the English page, which is not realistic (the Hindi login page is 402 KB, the English one 298.6 KB). The owner approved two changes:

1. **The budget is split in two.** Everything except fonts (document, styles, scripts, interface graphics): **258 KB or less, the same in every language**. Fonts: **150 KB or less per page language**, as above. An English page therefore stays within 300 KB as before; a Hindi page can reach about 408 KB, and the extra is fonts only. The reason: fonts do not hold up reading (text shows at once in a fallback font of matched size and the font replaces it when it arrives, 5.4), while code holds up the page becoming usable, so the code limit stays the same for everyone.
2. **The Devanagari font files are trimmed** to the characters normal Hindi text uses, leaving out Vedic signs and similar rarely used marks. The files are about 40 KB and 43 KB instead of 50 KB and 54 KB, about 20 KB less for both. Every Hindi message and a set of hard conjuncts (577 lines, both weights) and ten page screenshots were checked and are pixel for pixel the same as with the full font.

**First figures under this rule (14 Nov 2026):** Hindi login 381.1 KB (257.0 KB without fonts, 124.1 KB fonts), Hindi home 273.8 KB, Hindi category page 350.4 KB (fonts 137.0 KB); English login 297.4 KB. To bring the Hindi login page under 258 KB without fonts, the shop's text (`store`) and the cart's text (`cart`) are now carried only by the pages that use them (Document 7, T7-2). The page-size tests check every rule (`tests/e2e/support/page-size.ts`).

**Raised for the storefront header (owner, 15 Nov 2026).** Slice 3 adds the storefront header of 7.3 to every shop page: the search box with suggestions, the category row, the compact menu and the footer. With it the login page, the heaviest shop page because it is the only one that still loads the form-checking library, measured 261.2 KB without fonts in English (302.8 KB in total) and 262.3 KB in Hindi. The owner chose to raise the limits rather than give login a lighter header or change its form checks: **everything except fonts 265 KB or less, the same in every language** (was 258 KB); **an English page 307 KB or less in total** (was 300 KB). Fonts stay at 150 KB or less per page language. The page-size tests check the new figures (`tests/e2e/support/page-size.ts`).

**Found in Slice 4 (16 Nov 2026): the English catalogue on every page.** The last-resort error page (`src/app/global-error.tsx`) imported the whole English message catalogue, and Next.js puts that page's code into every page's browser files, so every page, in both languages, carried all the English text (about 10 KB), and each new screen's text made every page heavier. The page now keeps its three lines in `lib/global-error-text.ts`, checked against the catalogue by a unit test, and a page-size test checks that the Hindi login page carries no Vendor area text and no unneeded English text. Every page is about 10 KB lighter: login measures 251.6 KB without fonts in English (293.2 KB in total) and 252.8 KB in Hindi. **The limits are unchanged.**

**Found in Slice 5 (21 Nov 2026): every staff page carried every staff screen's text.** The Vendor and Admin layouts gave the browser the text of all staff screens, so each new Admin screen made every Vendor and Admin page heavier. Now the Vendor area carries only its own screens' text, and each Admin screen's folder adds only its own (`lib/messages.ts`: `VENDOR_AREA_SECTIONS`, `ADMIN_SCREEN_SECTIONS`). Measured on 21 Nov 2026, without fonts, before and after: Users and roles 258.9 to 252.0 KB in English and 262.0 to 253.7 KB in Hindi; vendor review in Hindi 263.3 to 257.2 KB; Admin home in Hindi 224.5 to 215.1 KB; product moderation 267.4 to 265.5 KB in English and 270.4 to 268.0 KB in Hindi; the vendor's stock 270.2 to 268.6 KB in English and 273.2 to 271.2 KB in Hindi; the vendor's products in Hindi 272.3 to 270.4 KB. **The limits are unchanged.** These were the first measurements of staff pages: **product moderation and the vendor's stock and products pages are above 265 KB without fonts, before and after this change**, mostly from their own code, not their text. Item 2 below (whether the figure suits staff screens) is for the owner.

**Items that need technical validation.**

1. The 100 KB first-screen data allowance, against real API responses (all three areas).
2. Whether 300 KB suits vendor and admin screens, which carry more interface code. **Settled (owner, 22 Nov 2026): staff pages may grow, but no limit is changed without the owner.** The limits above stay for the storefront and the login pages, and the existing checks on the Users and roles, Audit log and Sales admin pages stay and keep failing when a page goes over the approved limit. Staff pages without a check (product moderation, the vendor's stock and products, staff Sales for an admin or moderator, which are above the limits today) are measured and their sizes reported in each pull request, so growth stays visible. If a limit becomes impractical, the measurements and a proposed adjustment go to the owner before anything changes. The rules that keep pages light still apply (each screen carries only its own text; code a page may not need loads when needed).
3. How Hindi pages fit. **Settled (owner, 14 Nov 2026):** the split budget and the trimmed font above. Hindi staff screens are checked against the same rule when they are measured.
4. How a font loaded on demand for a second script counts (5.4).
5. Largest Contentful Paint on staff screens that wait for data.
6. The budget-device and slower-connection profiles, which Document 7 pins.

Visual rules that protect these targets:
- **Two font families**, only the weights in 5.1, and only the scripts a page's text needs (5.4).
- **Reserved space** for every image, skeleton and banner, so nothing shifts.
- **The hero photograph is the page's likely largest element.** Its space is reserved and nothing lower on the page may delay it.
- **Rendition by place** (section 12): thumb for small pictures, medium for cards, large for wide product pages.
- **No heavy effects**: no blur, large shadows or full-screen gradients. Decoration is dashed lines and flat colour, which cost almost nothing.
- **No decorative images and no video that plays by itself.**

### 14.1 Implementation constraints for Document 7

These follow from the visual rules above but are technical and belong to Document 7. They are listed so nothing is lost; none is decided here.

| Matter | What this document needs from it |
| --- | --- |
| Loading order of first-screen images and lazy loading below the screen | The hero photograph (and on compact the first product cards) are not delayed; later images load near the screen |
| Font loading | The mechanism, fallback sizing, and the **on-demand second-script font (D6-21)**, which must be reliable and must not compromise performance |
| Icon delivery | Vector icons that take the text colour, without an extra heavy dependency |
| **Third-party scripts and analytics** | **Deferred to Document 7.** Policy, privacy, security and performance are considered together there. Document 6 sets no blanket rule. Any script that is added is measured against these targets |
| Image selection mechanics | Choosing the right rendition per place (section 12) |
| Message glossary | How the one-word-per-concept list (17) is kept |

Sources: Google's [Web Vitals](https://web.dev/articles/vitals) (web.dev), which gives the "good" thresholds of 2.5 seconds or less for Largest Contentful Paint, 200 milliseconds or less for Interaction to Next Paint and 0.1 or less for Cumulative Layout Shift, measured at the 75th percentile of page loads, segmented by mobile and desktop. Checked 5 Nov 2026.

## 15. One identity, three surfaces (D6-03)

| | Storefront | Vendor | Admin |
| --- | --- | --- | --- |
| Purpose | Browse and buy | Run a shop | Review and manage |
| Page ground | `page` with `surface` cards | `page` with `surface` panels | Same as vendor |
| Madder use | Primary buttons, links, brand | Primary buttons, links, current-section bar in the side menu (navigation branding, 4.6) | Same as vendor |
| Stitch lines | Allowed on defined elements (6.3) | Empty states and one line under the title only | Same as vendor |
| Type | Display and H1 allowed; H2 section titles | H2 page titles; Body small in tables | Same as vendor |
| Spacing | Generous (section gaps 48 to 72) | Tight (section gaps 24; table rows 56, or 48 in dense lists, 8.9) | Same as vendor |
| Imagery | Large photos, 4:5 frames; real photography in the hero (12.4) | Small thumbnails and the upload list | Small thumbnails |
| Hover motion | None (no product-card zoom, D6-56) | None | None |
| Layout | Header with search; grids | Side menu with top bar | Side menu with top bar |
| Area marker | Header | "Vendor area" label with shop icon | "Admin area" label with shield icon (D6-37) |
| Colour for the area | None | None | None. The label, icon and navigation tell the areas apart (D6-29) |

**One identity and one set of interaction rules.** Storefront, vendor and admin share the colours, type, shape, components, states, focus ring, hit areas, validation feedback and writing rules in this document. A button, input, chip or table looks and works the same in all three. What adapts to each surface is limited to **spacing, density, which type sizes are used, decoration**. A surface-specific component is not made where a shared one fits; if one is needed, it is raised for approval first. There is no separate colour cue and no dark scheme for any area (D6-29).

## 16. Language, money, dates and numbers

How D-08, D-09, D-15 and D-16 look on screen.

Approved elsewhere: rupees with Indian digit grouping (D-15; Document 3, section 7), and IST (D-16). **Latin digits are approved (D6-07, 9 Nov 2026). Every other format in this table was proposed and is approved with this document (9 Nov 2026).** The formatting helper is Document 3's; the rules below are what people see.

| Item | English | Hindi | Notes | Status |
| --- | --- | --- | --- | --- |
| Money | ₹1,499, ₹2,19,999 | ₹1,499, ₹2,19,999 | Rupee sign before the amount and Indian grouping (lakh, crore). Whole rupees without decimals and paise with two (₹1,499.50) is approved with this document. Latin digits (D6-07) | Rupees and grouping approved; Latin digits approved (D6-07); the rest approved 9 Nov 2026 |
| Digits | 0 to 9 | 0 to 9 | Latin digits in both languages for prices, quantities, dates, phone numbers and codes. Devanagari digits are not used | Approved (D6-07) |
| Percent | 32% off | 32% छूट | The number is the backend's `discountPercent`, a whole percent rounded down (`area-3a-catalogue.md`). The wording is the frontend's | Number from the backend; wording approved 9 Nov 2026 |
| Dates | 5 Nov 2026 | 5 नवंबर 2026 | Day, month name, year; the month is written out in Hindi. Shown in IST | IST approved; layout approved 9 Nov 2026 |
| Times | 2:30 pm | दोपहर 2:30 | 12-hour clock. "IST" is added where the time zone could be unclear and always in staff audit and history tables | Approved (9 Nov 2026) |
| Relative time | 4h ago | 4 घंटे पहले | Only under 24 hours on the storefront and in lists. **The full date and time is always reachable without hover:** it is part of what a screen reader announces with the relative time; a tap or click on the relative time opens a small note with the full date and time (it also opens on keyboard focus, shows on hover where the device can hover, and can be dismissed); the note meets 1.4.13 (section 11). Staff audit and history tables show the full date and time in IST and no relative time | Approved (9 Nov 2026) |
| Phone | +91 98765 43210 | +91 98765 43210 | Document 3, section 7 says numbers are shown as the backend documents them (stored as +91 and ten digits, `area-1-accounts.md`) through one shared helper. Grouping the ten digits with a space is approved with this document, not in Document 3 | Approved (9 Nov 2026) |
| Language switch | हिन्दी | English | The other language's name in its own script; placement in 7.3 | Approved (9 Nov 2026) |
| Text growth | Hindi headings often run longer than English; layouts never rely on fixed widths for text | | | Guidance |

Text on screen is the frontend's own wording in both languages; backend text is not shown directly (D-09). Vendor-written content (titles, descriptions, brand names) appears as written.

## 17. Writing for the interface (D6-16)

Words are part of the design. These rules apply to every screen, in both languages. The strings themselves live in one place, the message catalogue, not inside screens (D-08, D-09). Sample wording elsewhere in this document is illustrative; final text is written to these rules.

| Area | Rule | Instead of | Write |
| --- | --- | --- | --- |
| Buttons that act | A verb plus what the person gets or does, 1 to 4 words | "Submit", "OK", "Click here" | "Save changes", "Send code", "Add to cart", "Ask for a coupon" |
| Links to a thing | May be a plain noun when the link opens that thing | "Learn more", "Discover", "Explore" | "Brands", "Addresses", "Stock history" |
| Same action, same name | One action keeps one name from the button to the confirmation | "Save" then "Your data has been stored" | "Save changes" then "Saved" |
| Headings | Say plainly what is here or what the person can do: 1 to 6 words, at most two lines. A noun phrase is the default; a short verb phrase is fine when the section is something to do or browse. Not a slogan, a question, a mood line or a command that addresses the person | "Discover your style" | Noun phrases: "New arrivals", "Stock history". Verb or clause forms: "Shop by category", "Needs your attention" |
| Hero headline | The one heading that may be a full sentence; it says what the person can do or find, and only what the marketplace can support (17.1) | A mood line, or a claim about the vendors or the products | "Browse new arrivals" (neutral example only) |
| Capitalisation | **Sentence case** for all English interface text: the first word and proper names only. No title case and no all-caps | "View All Brands", "ADD TO CART" | "View all brands", "Add to cart" |
| Proper names | Brand names, vendor names, places and language names keep their capitals | | "Jaipur Weaves", "Hindi" |
| Errors | Say what happened and what to do next. No apology, blame or exclamation mark | "Oops! Something went wrong!" | "Enter a 6-digit pin code.", "The stock summary could not be loaded. Try again." |
| Empty states | Say why it is empty and offer the next step; the action is a button | "Nothing here" | "No coupon requests yet." with the button "Ask for a coupon" |
| Numbers | With their unit, exactly as the backend gives them | "Many items" | "128 products", "Page 1 of 6" |
| Real information only | The claims rule in 17.1 | | |
| Length | Short sentences; a hero line of one or two sentences; no paragraph over five lines | | |
| Punctuation | Sentences end with a full stop (। in Hindi), including error messages and banners; a question ends with a question mark. Buttons, labels, headings, chips and one-word toasts ("Saved") have none | "Enter a pin code" followed by nothing, or a button ending in a full stop | "Enter a 6-digit pin code.", "Save changes" |
| One word per thing | Each concept has one word in each language. How the list is kept is decided in Document 7 | "Cart" in one place and "Basket" in another | "Cart" everywhere |
| Vendor, not seller (D6-19) | "Vendor" is the one word for a business that sells on the marketplace, on every screen and for every audience. "Seller" is not used as an interface term | "Seller application" in one place and "Vendor review" in another | "Vendor area", "Vendor application", "Vendor name" |

**Hindi.** Hindi text is written as natural Hindi, not word for word from English, and follows the same intent: short, plain, action-oriented wording. It does not copy English word order; for example the verb usually ends the sentence in Hindi, so an "action first" order is not forced. Words that people already use in Hindi, such as "कार्ट", are fine. Hindi has no letter case, so the capitalisation and all-caps rules do not apply to it. A fluent Hindi reader reviews the catalogue before release.

### 17.1 No invented claims

One rule for every piece of text and every number on every surface: **the interface says only what the marketplace's own data or the owner's approved wording supports.** Sample wording in this document is illustrative and is not approved copy.

| Kind of statement | Rule |
| --- | --- |
| Hero and page copy | Describes what the person can do or find. No claim about the vendors, the makers, the materials, the origin, the quality or the craft unless the owner approves it and can substantiate it. Neutral example: "Browse new arrivals" |
| Vendor descriptions | Words a vendor writes appear as the vendor's own and are not edited into claims by the marketplace. The marketplace adds no labels such as "trusted", "verified" or "artisan" unless a backend status or an approved programme supports the label. A status shown is the backend's own |
| Product claims | Origin, handmade, material, size and similar facts appear only if the catalogue holds that fact for that product |
| Promotions | A sale tag, an old price and a percentage off appear only when the backend says there is a sale price (Document 5, section 3). No banner or line announces an offer the backend does not hold |
| Prices | Always the backend's figure, never rounded or rewritten for effect |
| Reviews and ratings | None are shown. The backend documentation reviewed describes moderators reviewing listings and has no customer reviews or ratings |
| Counts | A number (products in a category, results found, pages) appears only when the backend sends it, exactly as sent |
| Urgency | No countdowns, "selling fast", "only 2 left" or "X people are viewing". The only stock wording is the plain per-variant "Low stock" on the product page (8.5) |

**Density in vendor and admin screens.** The same rules apply, and they favour plain, short, scannable text: labels name the field, buttons name the action, and table headings are one or two words. The aim is clarity, not decoration.

## 18. Backend documentation used

The backend documentation is authoritative (D6-26). Figures quoted in this document are for design context; if they differ, the backend wins. Paths are in the backend repository.

| What | Where |
| --- | --- |
| Photo upload limits and checks (500 px shorter side, 10 MB, 40 million pixels, JPEG, PNG or WebP, 8 photos, alt text up to 200 characters) | `docs/api/reference/area-3b-products.md`, photo upload; `docs/api/api-contract.md`, upload limits table; `docs/design/area-design-specs.md`, Area 3, image pipeline, steps 1 and 2 |
| Rendition sizes (thumb 300, medium 800, large 1600 px on the longest side, never enlarged) | `docs/design/area-design-specs.md`, Area 3, image pipeline, step 4; `docs/testing/swagger-test-guide.md`, section 9 (including the 1200 × 900 example) |
| Fields a product card carries (`coverUrl` medium, `thumbUrl`, `discountPercent`, in-stock and on-sale state) | `docs/api/reference/area-3a-catalogue.md`, product list |
| Product detail photos (`images[]` with `altText` and `urls` for large, medium and thumb) | `docs/api/reference/area-3a-catalogue.md`, product detail |
| Product list sorting (`newest`, default when there is no search text) and "newest" meaning most recently listed | `area-3a-catalogue.md`, product list, `sort`; `area-design-specs.md`, Area 3, listing |
| Brands and categories carry a name and a slug only (no image) | `area-3a-catalogue.md`, brands and category tree |
| One-time code: 6 digits, up to 12 characters accepted, resend wait, expiry | `docs/api/reference/area-1-accounts.md`, `/auth/otp/verify` and `/auth/otp/request` |
| Pincode: exactly six digits. Phone: stored as +91 and ten digits | `area-1-accounts.md`, addresses and user fields |
| Statuses of products, vendors, stock | `area-3b-products.md`, `area-2-vendors.md`, `area-4-inventory.md` |
| When a struck-through price and a sale price appear; money in paise | `area-3a-catalogue.md`; `area-5-sales-cart-coupons.md`; `docs/api/api-contract.md`, section 1 |
| Roles and who sees which area | `docs/api/api-contract.md`, section 2 |
| Request identifier | `docs/api/api-contract.md`, section 1: every response carries an `x-request-id` header and every error carries `requestId`. Whether the frontend server passes it to the browser is not verified (Document 5, V5-5) |

## 19. Handled in other documents

- **Document 7 (Conventions):** how tokens map to Tailwind CSS and shadcn/ui; component code and folder structure; which icon set; font loading, including the on-demand second-script font (D6-21); **third-party scripts and analytics policy (deferred from decision J: privacy, security and performance considered together)**; first-screen image loading order; the glossary mechanism; the exact device and network settings for performance tests and the validation of the budgets marked "needs validation" in section 14; the accessibility test routine; the browser matrix. The list of implementation constraints is in 14.1.
- **Document 5 and Document 1 (changed 9 Nov 2026):** "Become a vendor" and "vendor" throughout Document 5 (D6-19, D6-40), the home New arrivals section (D5-12), the unanswered-restore-offer rule (D5-13), the conditional request-ID "Copy" button (D5-14), the "Vendor area" and "Admin area" labels (D5-15), and "Vendors" in Document 1's roles description. V5-5 stays open in Document 5.
- **Stage 4 of this document:** the rendered component library.
- **Stage 5 of this document:** the screen designs for every route in Document 5 (done and approved 9 Nov 2026). The test of the 4:5 frame with complete photos (D6-33) and of every other placement in 12.1 against real vendor photography is **not done**; it waits for real photos (D6-62, Document 7 T7-7).

## 20. Differences and corrections

### 20.1 The Stage 1 Kora preview compared with this specification

The preview was made to compare directions, not to fix details. Stage 4 corrects these:

| In the preview | In this specification |
| --- | --- |
| Sale badge and "% off" text in madder | Sale is an ochre tag; "% off" in `ink` (4.4) |
| Selected size and checkbox in madder | Selection is `ink` (4.6) |
| Madder-tinted fills for the active menu item | `sunken` fill with a madder bar; no madder tint (4.2) |
| Dashed lines on tables and staff panels | Solid hairlines in staff tables and panels (6.3) |
| Dashed outline drawn over product photos | Frames only around a photo (6.3, 12.1) |
| "Only 3 left" on a product card | No stock warning on cards; "Low stock" (no count) on the product page only (8.5, 8.6) |
| Hero made of two flat garment swatches | Real fashion photography in a framed hero; swatches are development stand-ins only (12.4) |
| Hero headline "Clothes made by hand, from makers across India" | Neutral example copy under the claims rule (12.4, 17.1) |
| "View all Brands" | "View all brands" (sentence case, 17) |
| No hover movement | No hover movement (a 1.02 zoom approved on 5 Nov was withdrawn on 9 Nov, D6-56) (8.6, 13) |
| "Placeholder image" label on every photo | Design previews only (12.1) |
| Disabled buttons were hard to tell apart | Disabled = `sunken` fill, muted text (8.1) |
| Preview text sizes (for example 54 px hero) | The scale in 5.2 |

### 20.2 Corrections to the separate visual design-system page and to this document's own earlier text

Kept as decision history. These are not differences between the preview and the specification.

| Earlier | Now |
| --- | --- |
| A slow sweep on skeletons (design-system page) | Static skeletons (10, 13) |
| "WCAG 2.2 AA, applied by the system" (design-system page) | Design targets, verified in Stages 4 and 5 (11) |
| Hover tied to expanded screens; card title and quiet-button underline on hover | Hover by hover-capable input; colour only (8.1, 8.2, 8.6). The 1.02 photo zoom that this row once listed was withdrawn on 9 Nov (D6-56) |
| Sale tag described as carrying meaning by "icon and words" | The word "Sale" carries the meaning; no icon (4.4, 4.7) |
| Six-cell code input; sticky cart summary and add-to-cart bar | One field (D6-24); no fixed bottom bars (D6-22) |
| "Seller" wording in labels and examples | "Vendor" (D6-19) |
| Product cards cropped the photo (cover crop); complete-photo viewing existed only as a proposal | Every placement shows the complete photo (D6-33, D6-55) |
| A 1.02 hover zoom on product-card photos (D6-17, approved 5 Nov) | Withdrawn on 9 Nov 2026 (D6-56) |
| The D6-18 bundle of clarifications | Split into D6-41 to D6-54 (revision 7) |
| Outlined controls took a `sunken` fill on hover; the destructive button used the paler error edge as its border; swatches had no outline | `ink` border on hover; error text colour as the border; 1 px `control` swatch outline (4.7, 8.1, 8.2, 8.5) |
| A placeholder wordmark under a working name | The Dhaaga text-only wordmark, no logo (12.3, D6-57) |
| Provisional budgets with no data budget and no staff figures | Targets by area with a data allowance and a list of validation items (14) |
| The sticky Add to cart bar, "Admin area", the request-ID "Copy" button and the unanswered restore rule shown as pending | Approved 9 Nov 2026 (D6-35, D6-37, D6-38, D6-39) |

## 21. Open questions

After the owner's final decisions of 9 Nov 2026, **no open question needs a decision from you now.** Q6-1 to Q6-10 are resolved or settled as below. What stays open is checking work: the hero's product choice and permission (Q6-6), real-photo testing when real photos exist (D6-62), and the performance figures in section 14, which stay provisional until validated in Document 7 and the first working build. Recommended positions are **proposals only** until the owner approves them.

| ID | Question | Needed for | Status and recommended position (recommendations are proposals only) |
| --- | --- | --- | --- |
| Q6-1 | The Stage 1 comparison page is about 1.9 MB because it holds eight directions. Should the repository keep only the Kora preview and leave the rest out? | Where visual files live in the repo | **Resolved (9 Nov 2026, D6-28).** Only the Kora visual preview is kept in the repository |
| Q6-2 | Vendor and admin look alike and differ only by label and icon. Is that enough for a person who has both roles, or should staff get a visible colour cue (for example a dark top bar)? | Staff identity | **Resolved (9 Nov 2026, D6-29).** One identity; the areas are told apart by area label, icon and navigation; no dark scheme |
| Q6-3 | The brand name and logo. When are they decided? | Header, footer, login | **Resolved (9 Nov 2026, D6-57).** The name is Dhaaga; the mark is a text-only wordmark; there is no separate logo |
| Q6-4 | What performance targets apply to the storefront, vendor and admin, and how is API data counted? | Section 14 | **Resolved in structure (9 Nov 2026, D6-31).** Targets for each area, tested on a budget-device and slower-connection profile, with API data counted. **Open for technical validation:** the values marked in section 14 |
| Q6-5 | Digits: Latin digits in Hindi, or Devanagari digits instead? | Sections 5.3 and 16 | **Resolved (9 Nov 2026, D6-07).** Latin digits in English and Hindi |
| Q6-6 | Where do the hero photographs come from, who supplies them, and who confirms the rights, including consent for people shown? | Section 12.4 | **Mostly resolved (9 Nov 2026, D6-58, D6-61):** one static catalogue product photo chosen by the marketplace admin, vendor permission confirmed, click opens the product page, larger rendition when needed. **Still open:** how the admin's choice is stored (Document 7, T7-8), and the real-photo sharpness check when real photos exist (T7-7) |
| Q6-7 | Which word do staff screens use for a seller? | Section 17 | **Resolved by decision A (D6-19): "Vendor" everywhere.** Applied to the Document 5 and Document 1 drafts (D6-40) |
| Q6-8 | Is a separate "View full photo" control wanted on the product page, and a whole-photo preview in the vendor upload list? Is the 4:5 ratio right for real photos? | Section 12.1 | **Resolved (9 Nov 2026, D6-59):** no control and no preview for now; revisited only if Stage 5 testing shows a need. The 4:5 ratio with complete photos is still to be tested with real photography (D6-62, T7-7) |
| Q6-9 | What is the staff-facing area label: "Admin area", "Staff area" or something else? Document 5 says "Admin" | Sections 7.3 and 15 | **Resolved (9 Nov 2026, D6-37): "Admin area".** |
| Q6-10 | Should the product-page main photo, the thumbnails, the cart and staff-table thumbnails and the vendor upload list follow the card's complete-photo rule? | Section 12.1 | **Resolved (9 Nov 2026, D6-55).** Yes, in every placement. Tested in Stage 5 |

### 21.1 Points the source documents do not settle, and points to confirm

| Point | What is known | What is missing |
| --- | --- | --- |
| Request ID on screens | Traced on 9 Nov 2026 (Document 5, V5-5): the backend sets `x-request-id` and `requestId` (`api-contract.md`, section 1). Server-rendered pages have the id by design; browser data requests are not confirmed, because Documents 3 and 4 do not require the frontend server's endpoints to return it. Shown only when present (D6-38; D5-14) | **Open:** an implementation check in the first build, and the smallest fix (one sentence in Document 3, section 5 and Document 4, section 3: endpoints include the backend's `requestId` in their error response), pending your approval |
| New arrivals "View all" and the hero action | No approved route lists all products newest first (Document 4, section 5); decided: no "View all" link (D6-36) | A destination route, if the owner later wants one. The hero action has the same question (12.4) |
| Home page and caching (Document 5, Q5-4) | **Settled (9 Nov 2026):** Document 4, section 7 and D4-09 say New arrivals shares the home page's cache refresh interval and holds public catalogue data only | The interval itself is set in Document 7 (Q4-4) |
| Image renditions (12.1) | The 500 px check, the 300 / 800 / 1600 px caps and no enlargement are documented | Whether rendition width and height are sent to the client; whether any aspect ratio is expected; whether 500 px is enough for large display |
| Performance values (14) | Targets approved by area (D6-31); fonts are measured | The items listed in section 14 that need technical validation |
| Hero source and rights (Q6-6) | Decided (D6-58, D6-61): one static catalogue photo chosen by the marketplace admin, vendor permission confirmed, links to the product. Rule (D6-32) unchanged | How the admin's choice is stored (no backend feature; Document 7, T7-8); sharpness of the rendition with real photos in Stage 5 |
| Third-party scripts and analytics | Deferred to Document 7 (decision J) | The policy |
| Font loading mechanism | Decided in principle (D6-21) | The mechanism, which Document 7 specifies |

## 22. Conflict handling

Approved decisions in Documents 1 to 5 are not changed by this document. It applies D-03, D-08 to D-11, D-15 to D-17 and D5-02, D5-03, D5-05, D5-08, D5-09 and D5-11.

**Known points of difference.** The owner approved changes to Document 5 on 9 Nov 2026 and they are now made in that draft: (1) the D5-10 label "Become a seller" is now "Become a vendor" (D6-19, D6-40), with a note in D5-10 that the label was changed; (2) the home page gains New arrivals without "View all" (D5-12), which extends section 6.1; (3) section 9 gains the unanswered-restore-offer rule (D5-13) and section 3 the conditional request-ID "Copy" button (D5-14); (4) "Vendor area" and "Admin area" are used as area labels (D5-15). Document 1's roles description now says "Vendors". Documents 1, 2 and 4 were aligned on 9 Nov 2026 ("Vendor area", "Admin area"; wording only, no routes or permissions changed). **Still open:** Document 4 may need a note about the cached home page (Document 5, Q5-4). If a later change conflicts with an approved decision, work stops and the owner is asked.

## 23. Edit checklist

"Type" shows whether an item is an owner decision, drafted work or still open. The document was approved as a whole on 9 Nov 2026; items marked open stay open.

| # | Check | Type | State |
| --- | --- | --- | --- |
| 1 | Kora direction and the four adjustments recorded (D6-01) | Owner-approved | Recorded |
| 2 | Semantic colours separate; madder never carries a message (D6-02, 4.6) | Owner-approved | Recorded |
| 3 | Contrast of the known token pairs and of component states calculated (4.7, rechecked 9 Nov 2026); built components and screens to be verified in Stages 4 and 5 | Drafted | Calculations done; later stages for built components |
| 4 | Hindi typography rules (D6-06, 5.3) | Owner-approved | Recorded |
| 5 | Technical implementation (code, hooks, packages, loading mechanisms, scripts) kept out; constraints listed for Document 7 (14.1) | Drafted | Done |
| 6 | Backend figures quoted for design context with sources; backend documentation authoritative (D6-26, 18) | Owner-approved (decision I) | Done |
| 7 | Document 5 state rules reflected, including the added states in section 10 | Drafted | Done; layouts for Stage 4 and 5 |
| 8 | Differences and corrections listed (20.1, 20.2) | Drafted | Done |
| 9 | Owner decisions of 5 Nov 2026 on `taste-skill` (D6-14 to D6-17); D6-17 (hover zoom) withdrawn on 9 Nov (D6-56) | Owner-approved | Recorded |
| 10 | Owner decisions A, B, D, E, F, G, H, I, K recorded as D6-19 to D6-27 (5 Nov); decisions of 9 Nov 2026 recorded as D6-28 to D6-40, with D6-07 approved | Owner-approved | Recorded |
| 11 | Decision C (5 Nov: whole-photo viewing not approved) narrowed on 9 Nov (D6-33: cards show the complete photo; the control and other placements stay open); decision J (deferred to Document 7) | Owner decisions | Recorded |
| 12 | D6-18 retired and split into D6-41 to D6-54 (revision 7); all fourteen rules approved on 9 Nov 2026 | Owner-approved | Recorded |
| 13 | Card stock rules checked against the API contract | Drafted | Done |
| 14 | Review of sections 9 to 23 applied (revision 4): restore choices and stacking order, step samples, added states, upload area border, row heights, sheet motion, punctuation, Hindi wording, formats marked as proposals, Google source, reference table, section titles | Drafted | Done in revision 4 |
| 14a | Revision 5 corrections: section 10 base states, sticky Add to cart reading, area label, unanswered restore rule, New arrivals destination, hero direction preserved, full reread fixes (Document 5 references in section 10, duplicate sentence in 16, stray "verify" in 8.3, the hero action) | Drafted | Done in revision 5 |
| 14b | Revision 6 (9 Nov 2026): pending notes removed (sticky Add to cart bar, "Admin area", restore rule, request-ID Copy, hero, performance, digits); contrast corrections (4.7, 8.1, 8.2, 8.5); complete photo on cards (8.6, 12.1); text wordmark (12.3); performance by area (14); Q6 statuses (21); full reread | Owner decisions recorded; corrections drafted | Done in revision 6 |
| 14c | Revision 7 (9 Nov 2026): D6-04, 05, 06, 08, 09, 10, 11 approved; D6-18 split; hover zoom removed (8.1, 8.6, 11, 13, 15, 20); complete photo in every placement (8.6, 12.1, D6-55); performance kept provisional (14); Document 5 and Document 1 references updated (7.4, 19, 21, 22); full reread | Owner decisions recorded | Done in revision 7 |
| 15 | Request-ID "Copy" button shown only when the backend reliably provides an id (D6-38) | Owner-approved | Recorded; V5-5 stays open in Document 5 |
| 15a | Items still open after approval: hero product choice and permission (Q6-6, checking work); real-photo testing when real photos exist (D6-62, T7-7); performance figures provisional until validated (Document 7, T7-1, T7-2; Document 7 approved 9 Nov 2026) and the first working build; Document 5 V5-5 (implementation check; Document 7 T7-4) | Open | Open, carried forward |
| 16 | Document 5 and Document 1 changes made on 9 Nov 2026 (the separate proposal file is superseded) | Owner-approved | Done; Document 5 approved 9 Nov 2026 |
| 17 | Open questions: none needs a decision now; the checking items in 21.1 remain | Open | Open, carried forward |
| 18 | Owner review and explicit approval of Document 6 | Owner-approved | **Approved 9 Nov 2026.** Stages 4 and 5 were started on the owner's instruction and approved (rows 24 to 27) |
| 19 | Approval pass (9 Nov 2026): status set to Approved; the nine split rules and the remaining proposed items approved with the document; open questions and provisional figures left as they are | Owner-approved | Done |
| 20 | Final pass (9 Nov 2026): "Vendor area" and "Admin area" wording aligned in Documents 1, 2 and 4; open items reviewed (Q6-3, Q6-6, Q6-8, performance figures, and Document 5 V5-5, Q5-1, Q5-4): no new decision had been made, so all stay open | Owner-approved wording; open items unchanged | Done |
| 21 | Document 4 decisions D4-05 to D4-08 approved by the owner on 9 Nov 2026; headers of Documents 1 to 4 set to Approved. No Document 6 content changed | Owner-approved | Recorded in Documents 1 to 4 and the README |
| 22 | Final decisions (9 Nov 2026): Dhaaga text-only wordmark (D6-57); hero is one static product cover photo, no button (D6-58); no "View full photo" control (D6-59); banners and featured lists deferred (D6-60); Q6-3, Q6-6 (source) and Q6-8 resolved; V5-5 traced and kept open; Q5-4, Q4-5 and the settled earlier questions recorded; performance kept provisional | Owner-approved | Done in revision 8 |
| 23 | Hero details (D6-61); Stage 4 component library built and presented for review (separate visual page); Document 7 written; Q6-6 mostly resolved | Owner-approved decisions | Done; Stage 4 awaits review |
| 24 | Stage 4 approved by the owner (9 Nov 2026). Stage 5 Storefront screens built and presented for review (approved by the owner 9 Nov 2026); contrast of the combinations used, keyboard and screen reader behaviour, and real vendor photos in the 4:5 frames are not yet checked | Owner review pending | Open |
| 25 | Stage 5 Storefront approved (9 Nov 2026). Vendor area screens built and presented for review. Still unchecked: contrast of used combinations, keyboard and screen reader behaviour, real vendor photos, Hindi wording review | Owner review pending | Open |
| 26 | Stage 5 Vendor area approved (9 Nov 2026). Admin area screens built and presented for review. Still unchecked: contrast of used combinations, keyboard and screen reader behaviour, real vendor photos, Hindi wording review | Owner review pending | Open |
| 27 | Stage 5 Admin area approved (9 Nov 2026); all three areas approved. Still open, not claimed: contrast of the combinations used on the screens, keyboard and screen reader behaviour (Document 7, section 10), testing with real vendor photos in the 4:5 frames, Hindi wording review, hero choice storage (Document 7, T7-8) | Owner-approved screens; checks open | Open |
| 28 | Stand-in images decided (D6-62): generated garment illustrations used for design; real-photo testing deferred to when real photos exist (T7-7) | Owner-approved | Done; real-photo test open |
| 29 | 8.8: when the last "Load more" batch has loaded and the button is gone, focus moves to the first card added (Document 7, pull request #48) | Owner-approved (14 Nov 2026) | Done |
| 30 | Section 14: for Hindi pages, a split budget (258 KB without fonts in every language, fonts 150 KB per language) and a trimmed Devanagari font; item 3 updated | Owner-approved (14 Nov 2026), applied only after the Q7-7 measurements are reviewed | Done in row 31 |
| 31 | Section 14 and 5.4: the split budget and the trimmed font applied after the owner reviewed the Q7-7 results; first figures under the rule; item 3 settled | Owner-approved (14 Nov 2026) | Done (pull request #49) |
| 32 | Section 14: everything except fonts 265 KB or less in every language (was 258 KB), an English page 307 KB or less in total (was 300 KB), for the storefront header of 7.3 on every shop page | Owner-approved (15 Nov 2026) | Done (Slice 3) |
| 33 | Section 14: the English catalogue removed from every page (found in Slice 4); the limits are unchanged | Bug fix, no decision | Done (Slice 4) |
| 34 | Section 14: each staff page carries only its own screens' text (found in Slice 5); first staff page measurements, three above the limit before and after; the limits are unchanged | Bug fix, no decision | Done (Slice 5) |
| 35 | Section 14, item 2 settled: staff pages may grow; the limits stay for the storefront and login pages; staff pages are still measured and reported | Owner decision, 22 Nov 2026 | Done |
| 36 | Section 14, item 2 made exact (owner, 22 Nov 2026): the existing checks on Users and roles, Audit log and Sales stay and keep failing over the approved limit; no limit changes without the owner seeing the measurements and a proposal first | Owner decision, 22 Nov 2026 | Done |
| 37 | 8.2, Loading: a busy control keeps focus (`aria-disabled`, not `disabled`); found by the Slice 6 keyboard checks | Owner decision, 23 Nov 2026 | Done |
| 38 | 4.7: the `control` contrast figures corrected (4.12 / 3.80 / 3.47) and the sale tag figure placed; checked by a unit test from Slice 6a. No colour or rule changed | Correction, no decision | Done |
| 39 | 8.5: what is selected at the start, and "Add to cart" always pressable while anything is in stock | Owner decision, 23 Nov 2026 | Done |
