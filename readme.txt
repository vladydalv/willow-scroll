=== Willow Scroll ===
Contributors: wpspacenerd
Donate link: https://www.spacenerd.space/
Tags: sticky header, transparent header, header, block themes, scroll
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A different header for different parts of the site: transparent over a hero, dark on products, regular elsewhere. Set per template, category or page.

== Description ==

Most sites need more than one header. The front page starts with a full-width image and wants a transparent header over it. A shop wants a dark header on products. The blog is fine as it is. Willow Scroll lets you set that once, per template, per category or per page, instead of writing CSS for every case.

**How it differs from other header plugins**

* A rule per template, following the WordPress template hierarchy: any post type, an archive, a taxonomy, the front page, search, 404, or a custom template of your theme. A rule for "Products: single" works even when the theme has no separate template for products.
* A rule per category or tag that can cover the posts in it, not only its archive. When a post is in several categories, the rule higher in the list wins, and the order is yours to set.
* Every page and post can override all of it in the editor, and each field shows the value it inherits and where it comes from.
* A separate logo for each look of the header: regular, transparent and sticky, each falling back to the site logo.
* Shrinking to a height you choose, measured on your own site, so it also works with themes that size header rows with min-height.
* Works the same in block themes and classic themes: the header is found on your site once and remembered.

**Header type**

* Regular or transparent. A transparent header lies over the first section, for pages that start with a large image, and is fully see-through until the visitor scrolls.
* Sticky or not. A sticky header can stay on screen, slide away while scrolling down and return on the way up, or slide away and return near the top of the page.

**Look of the header**

* Background for the regular header and for the sticky header: a color or a gradient, taken from your theme's palette, with transparency and a direction for gradients.
* Blur behind a semi-transparent sticky header, a shadow with its own color, offset and softness, and a hairline at the bottom.
* Floating sticky header: its own distance from the sides and from the top, with rounded corners set together or one by one.
* Shrink: set the height of the sticky header in pixels. The header's rows are measured on your site, so themes that size rows with min-height shrink as well, not only themes that use padding.
* A logo for each look of the header: regular, transparent and sticky. Each falls back to your site logo, and the logo can change size between the top and the sticky state.
* Presets for the sticky look: Glass, Solid, Minimal, Always on top, Floating, Dark glass and Compact, in the colors of your theme.
* Motion: duration and easing, turned off automatically for visitors who prefer reduced motion.

**Where a setting applies**

* Site settings for the whole site.
* Rules per template: the front page, the blog, pages, single entries of any post type, archives of a post type, search, 404, and the custom templates of your theme.
* Rules per category, tag or taxonomy term. A rule covers the archive page, and the posts in that term when you turn that on. When a post is in several terms, the rule higher in the list wins, and rules are reordered with the arrows.
* Settings per page or post, in the block editor sidebar and in the Classic Editor meta box. Each field shows the value it inherits and where it comes from, and returns to it with one click.
* Order of priority: the page, then the matching rule, then the site settings.

**Small screens and fine-tuning**

* Below a breakpoint you choose, the header can be left exactly as the theme has it.
* Scroll thresholds, the stacking order and the selectors of the header and of the element that paints its background can be set by hand when the automatic result is not what you want.

**Extras, each working on its own**

* Reading progress bar: color, height, top or bottom.
* Scroll-to-top button: six arrow icons, colors, hover effect and hover colors, size, padding, corner radius, side and distance from the edges.
* Custom scrollbar: width, track and thumb colors, roundness and border, with the system scrollbar kept on small screens.

**Good to know**

* No external services, no libraries, nothing loaded from other servers. The styles are printed inline and the script is a single small file.
* The hidden header returns when a visitor reaches it with the keyboard.
* Everything the plugin stores is removed when you delete it.

== Installation ==

1. Upload the plugin to `/wp-content/plugins/willow-scroll`, or install it from Plugins → Add New.
2. Activate it on the Plugins screen.
3. Open your site once while logged in, so the header is found.
4. Go to Settings → Willow Scroll.

== Frequently Asked Questions ==

= Does it work with my theme? =

It works with block themes and with classic themes. In a block theme the header template part is used directly. In a classic theme the header is found on your site the first time you open it while logged in as an administrator, and the result is remembered for that theme. If the wrong element is picked, enter the class or id yourself in Header → Header detection.

= The header was not found automatically. What now? =

Enter the header's class or id in Header → Header detection → Header class. If the theme paints the header background on an inner wrapper, add that class in Background elements. Both fields accept any CSS selector.

= My theme already has a sticky or transparent header. Should I use both? =

No. Turn the theme's own option off, otherwise the theme and the plugin will both move and paint the header. The plugin warns you when it detects that the theme does this.

= The sticky header keeps the theme's background. Why? =

A background is only applied once you pick one in Appearance → Sticky header. Until then the header keeps the background it has in your theme.

= Can posts of one category look different? =

Add a rule for that category in the Templates tab and turn on "Apply to posts as well". If a post belongs to several categories, the rule higher in the list wins; reorder rules with the arrows. A post can still override everything in the editor.

= Can a single page look different? =

Yes. Open the page in the editor and turn on "Override header settings" in the Willow Scroll panel. A page always wins over a rule, and a rule wins over the site settings.

= Why doesn't the header shrink on my theme? =

Shrinking never makes the header smaller than its logo and menu need. Lower the logo height in Shrink & logo, or raise the height you asked for.

= Does it slow the site down? =

The styles are printed inline in the head, so there is no extra stylesheet request, and the script is a single file of a few kilobytes with no libraries. Scrolling is handled in one animation frame, and the header is moved with transforms, so the page is not laid out again.

= What does it store, and what happens when I delete it? =

The settings, the template rules and the result of header detection are stored as options, and per-page settings as post meta. Deleting the plugin removes all of them.

== Screenshots ==

1. Header: type, visibility, motion and header detection.
2. Appearance: the regular and the sticky header, with the theme's colors, gradients and the floating look.
3. Shrink and the logo for each look of the header.
4. Rules: the front page, a post type, a category that also covers its posts.
5. Header settings for a single page in the block editor.
6. Extras: reading progress, a scroll to top button and a custom scrollbar.

== Upgrade Notice ==

= 1.0.0 =
First public release.

== Changelog ==

= 1.0.0 =
* First public release.
