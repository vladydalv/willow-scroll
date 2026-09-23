/**
 * Willow Scroll — frontend.
 * Loaded with `defer`, so the DOM is parsed when this runs.
 */
( function () {
	'use strict';

	var cfg = window.willowScrollConfig;
	if ( ! cfg ) {
		return;
	}

	var root = document.documentElement;
	var reduceMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	var mobileMq = cfg.mobileQuery ? window.matchMedia( cfg.mobileQuery ) : null;
	var adminBar = document.getElementById( 'wpadminbar' );

	var header = null;
	var spacer = null;
	var resizeObs = null;
	var progress = null;
	var stt = null;

	var active = false;
	var isFixed = false; // true for overlay, or flow when sticky can't work
	var scrolled = false;
	var hidden = false;
	var baseH = 0; // unscrolled height
	var headerH = 0;
	var anchorY = 0;
	var ticking = false;
	var adminBarScrolls = false;
	var rootScrollPad = '';
	var rows = [];
	var lastWidth = 0;
	var baseMarginBottom = '';

	/* ── Lookup ────────────────────────────────────────────────────── */

	function query( sel ) {
		try {
			return sel ? document.querySelector( sel ) : null;
		} catch ( e ) {
			return null;
		}
	}

	/**
	 * The configured selector wins; otherwise the header marked on the server
	 * (block themes), otherwise the usual theme header elements.
	 */
	function findHeader() {
		var el = query( cfg.selector );
		if ( cfg.selector && ! el && window.console ) {
			window.console.warn( 'Willow Scroll: header selector "' + cfg.selector + '" matched nothing, detecting the header automatically.' );
		}
		el = el || query( '.willow-header' ) || query( cfg.detectedHeader );
		for ( var i = 0; ! el && i < cfg.fallbacks.length; i++ ) {
			el = query( cfg.fallbacks[ i ] );
		}
		return el;
	}

	/**
	 * Sticky only works when no ancestor creates a scroll container and the
	 * parent is taller than the header (otherwise there is nowhere to stick).
	 */
	function stickyWorks() {
		var parent = header.parentElement;
		// A wrapper exactly as tall as the header leaves it no room to stick.
		if ( ! parent || parent.getBoundingClientRect().height <= header.offsetHeight + 1 ) {
			return false;
		}
		for ( var node = parent; node && node !== document.body; node = node.parentElement ) {
			var cs = window.getComputedStyle( node );
			if ( /(auto|scroll|hidden)/.test( cs.overflowX + cs.overflowY ) ) {
				return false;
			}
		}
		// body overflow only matters when it doesn't propagate to the viewport.
		var htmlCs = window.getComputedStyle( root );
		var bodyCs = window.getComputedStyle( document.body );
		if ( htmlCs.overflowX + htmlCs.overflowY !== 'visiblevisible' && /(auto|scroll|hidden)/.test( bodyCs.overflowX + bodyCs.overflowY ) ) {
			return false;
		}
		return true;
	}

	/* ── State ─────────────────────────────────────────────────────── */

	function setScrolled( value ) {
		if ( value !== scrolled ) {
			scrolled = value;
			header.classList.toggle( 'willow-is-scrolled', value );
		}
	}

	function setHidden( value ) {
		if ( value !== hidden ) {
			hidden = value;
			header.classList.toggle( 'willow-is-hidden', value );
		}
	}

	function syncAdminBar() {
		adminBarScrolls = !! adminBar && window.getComputedStyle( adminBar ).position !== 'fixed';
	}

	// Below 601px the admin bar scrolls away with the page; fixed elements follow it.
	function adminOffset() {
		return adminBarScrolls ? Math.max( 0, adminBar.getBoundingClientRect().bottom ) + 'px' : '';
	}

	function updateAdminOffset() {
		var top = adminOffset();
		if ( top ) {
			header.style.setProperty( '--willow-top', top );
		} else {
			header.style.removeProperty( '--willow-top' );
		}
	}

	function updateHeader( y ) {
		updateAdminOffset();
		// A header that doesn't stick keeps its top look and scrolls away with the page.
		if ( ! cfg.sticky ) {
			return;
		}
		setScrolled( y > cfg.scrolledOffset );

		if ( cfg.behavior === 'always' || header.matches( ':focus-within' ) ) {
			setHidden( false );
			anchorY = y;
			return;
		}
		if ( y <= ( cfg.hideAfter || baseH ) ) {
			setHidden( false );
			anchorY = y;
			return;
		}
		var delta = y - anchorY;
		if ( Math.abs( delta ) < cfg.tolerance ) {
			return;
		}
		if ( delta > 0 ) {
			setHidden( true );
		} else if ( cfg.behavior === 'smart' ) {
			setHidden( false );
		}
		anchorY = y;
	}

	function onFrame() {
		ticking = false;
		var y = Math.max( 0, window.scrollY );
		if ( active ) {
			updateHeader( y );
		}
		if ( progress ) {
			if ( cfg.progressTop ) {
				progress.style.top = adminOffset();
			}
			var max = root.scrollHeight - window.innerHeight;
			progress.style.transform = 'scaleX(' + ( max > 0 ? Math.min( y / max, 1 ) : 0 ) + ')';
		}
		if ( stt ) {
			stt.classList.toggle( 'willow-is-visible', y > cfg.sttOffset );
		}
	}

	function onResize() {
		syncAdminBar();
		// Rows differ per layout (desktop / mobile header); remeasure when the width changes.
		if ( active && window.innerWidth !== lastWidth ) {
			lastWidth = window.innerWidth;
			markRows();
			measure();
		}
		requestFrame();
	}

	function requestFrame() {
		if ( ! ticking ) {
			ticking = true;
			window.requestAnimationFrame( onFrame );
		}
	}

	/* ── Layout ────────────────────────────────────────────────────── */

	function measure() {
		headerH = header.offsetHeight;
		// With shrinking, the full height comes from markRows(), never from a frame mid-animation.
		if ( ! cfg.shrink || ! rows.length ) {
			baseH = headerH;
		}
		if ( spacer ) {
			spacer.style.height = baseH + 'px';
		} else if ( ! isFixed && cfg.shrink ) {
			// Sticky header in the flow: keep its full footprint at every frame of the
			// animation, both ways, so the content below never moves.
			var gap = Math.max( 0, baseH - headerH );
			header.style.marginBottom = gap ? 'calc(' + ( baseMarginBottom || '0px' ) + ' + ' + gap + 'px)' : '';
		}
		// Anchors land below a header that stays on screen.
		if ( cfg.sticky ) {
			root.style.scrollPaddingTop = 'calc(var(--wp-admin--admin-bar--height, 0px) + ' + baseH + 'px)';
		}
	}

	/**
	 * Shrink to a height. The header and its vertical wrappers ("rows") are
	 * collapsed for as long as shrinking is on; only the innermost row's padding
	 * sets the height: at the top it recreates the theme's own height, when sticky
	 * it gives the chosen one. One property on one element, so the animation is a
	 * single motion both ways. Measured on setup, width change and page load.
	 */
	function markRows() {
		rows.forEach( function ( r ) {
			r.removeAttribute( 'data-willow-row' );
		} );
		rows = [];
		header.classList.remove( 'willow-shrinks' );
		header.style.removeProperty( '--willow-pad-top' );
		header.style.removeProperty( '--willow-pad-sticky' );
		if ( ! cfg.shrink || ! cfg.sticky ) {
			return;
		}
		var hr = header.getBoundingClientRect();
		if ( ! hr.width ) {
			return;
		}

		// Rows: containers in the flow that take most of their parent's height and at
		// least half the header's width. Width-limited containers count; logos, menus
		// and side columns don't.
		var LEAF = /^(IMG|SVG|A|BUTTON|INPUT|SELECT|TEXTAREA|PICTURE|VIDEO|SPAN|P|H1|H2|H3|H4|H5|H6|UL|OL|LI)$/;
		var level = [ header ];
		var found = [ header ];
		for ( var depth = 0; depth < 8 && level.length; depth++ ) {
			var next = [];
			level.forEach( function ( el ) {
				var parentH = el.getBoundingClientRect().height;
				Array.prototype.forEach.call( el.children, function ( c ) {
					if ( LEAF.test( c.tagName ) ) {
						return;
					}
					var r = c.getBoundingClientRect();
					var pos = window.getComputedStyle( c ).position;
					if ( r.height >= parentH * 0.6 && r.width >= hr.width * 0.5 && pos !== 'absolute' && pos !== 'fixed' ) {
						next.push( c );
					}
				} );
			} );
			found = found.concat( next );
			level = next;
		}
		rows = found;
		var inner = rows[ rows.length - 1 ];

		// Three synchronous measurements; nothing is painted in between.
		var had = { scrolled: header.classList.contains( 'willow-is-scrolled' ), noAnim: header.classList.contains( 'willow-no-anim' ) };
		var marginBottom = header.style.marginBottom;
		header.style.marginBottom = '';
		header.classList.add( 'willow-no-anim' );
		header.classList.remove( 'willow-is-scrolled' );

		var fullH = header.offsetHeight; // the theme's own height at the top

		rows.forEach( function ( r ) {
			r.setAttribute( 'data-willow-row', r === inner ? 'inner' : '' );
		} );
		header.classList.add( 'willow-measuring' ); // rows collapsed, no padding
		var contentTop = header.offsetHeight;
		header.classList.add( 'willow-is-scrolled' ); // sticky look, e.g. a smaller logo
		var contentSticky = header.offsetHeight;
		header.classList.remove( 'willow-measuring' );
		if ( ! had.scrolled ) {
			header.classList.remove( 'willow-is-scrolled' );
		}
		header.style.marginBottom = marginBottom;

		header.style.setProperty( '--willow-pad-top', Math.max( 0, ( fullH - contentTop ) / 2 ) + 'px' );
		header.style.setProperty( '--willow-pad-sticky', Math.max( 0, ( cfg.shrinkHeight - contentSticky ) / 2 ) + 'px' );
		header.classList.add( 'willow-shrinks' );
		baseH = fullH;

		if ( ! had.noAnim ) {
			void header.offsetHeight; // settle the collapsed state before transitions return
			header.classList.remove( 'willow-no-anim' );
		}
	}

	function addSpacer() {
		var cs = window.getComputedStyle( header );
		spacer = document.createElement( 'div' );
		spacer.className = 'willow-header-spacer';
		spacer.setAttribute( 'aria-hidden', 'true' );
		spacer.style.marginTop = cs.marginTop;
		spacer.style.marginBottom = cs.marginBottom;
		header.parentNode.insertBefore( spacer, header );
	}

	function setup() {
		if ( active ) {
			return;
		}
		active = true;
		rootScrollPad = root.style.scrollPaddingTop;
		baseMarginBottom = window.getComputedStyle( header ).marginBottom;

		// No transitions until the first state is applied (reload mid-page).
		header.classList.add( 'willow-header', 'willow-mode-' + cfg.mode, 'willow-no-anim' );

		isFixed = cfg.mode === 'overlay';
		if ( ! isFixed && cfg.sticky && ! stickyWorks() ) {
			isFixed = true;
			addSpacer();
			header.classList.add( 'willow-pos-fixed' );
		}

		lastWidth = window.innerWidth;
		markRows();
		measure();
		if ( window.ResizeObserver ) {
			resizeObs = new ResizeObserver( measure );
			resizeObs.observe( header );
		}
		header.addEventListener( 'focusin', onFocusIn );

		anchorY = Math.max( 0, window.scrollY );
		updateHeader( anchorY );
		window.requestAnimationFrame( function () {
			window.requestAnimationFrame( function () {
				header.classList.remove( 'willow-no-anim' );
			} );
		} );
	}

	function teardown() {
		if ( ! active ) {
			return;
		}
		active = false;
		setHidden( false );
		setScrolled( false );
		rows.forEach( function ( r ) {
			r.removeAttribute( 'data-willow-row' );
		} );
		rows = [];
		header.style.removeProperty( '--willow-pad-top' );
		header.style.removeProperty( '--willow-pad-sticky' );
		header.classList.remove( 'willow-pos-fixed', 'willow-no-anim', 'willow-shrinks' );
		header.style.removeProperty( '--willow-top' );
		header.style.marginBottom = '';
		header.removeEventListener( 'focusin', onFocusIn );
		if ( resizeObs ) {
			resizeObs.disconnect();
			resizeObs = null;
		}
		if ( spacer ) {
			spacer.remove();
			spacer = null;
		}
		root.style.scrollPaddingTop = rootScrollPad;
	}

	function onFocusIn() {
		setHidden( false );
	}

	function syncMobile() {
		if ( mobileMq && mobileMq.matches ) {
			teardown();
		} else {
			setup();
		}
	}

	/* ── Extras ────────────────────────────────────────────────────── */

	function setupExtras() {
		if ( cfg.progressBar ) {
			progress = document.createElement( 'div' );
			progress.id = 'willow-progress';
			progress.setAttribute( 'aria-hidden', 'true' );
			document.body.appendChild( progress );
		}
		if ( cfg.stt && ( stt = document.getElementById( 'willow-stt' ) ) ) {
			stt.addEventListener( 'click', function () {
				window.scrollTo( { top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' } );
				var target = header && header.querySelector( 'a[href], button' );
				if ( target ) {
					target.focus( { preventScroll: true } );
				}
			} );
		}
	}

	/* ── Init ──────────────────────────────────────────────────────── */

	syncAdminBar();
	setupExtras();

	if ( cfg.header && ( header = findHeader() ) ) {
		syncMobile();
		if ( mobileMq ) {
			mobileMq.addEventListener( 'change', syncMobile );
		}
	}

	// Images (the logo above all) may finish loading after setup: remeasure once.
	if ( document.readyState !== 'complete' ) {
		window.addEventListener( 'load', function () {
			if ( active && cfg.shrink ) {
				markRows();
				measure();
			}
		} );
	}

	window.addEventListener( 'scroll', requestFrame, { passive: true } );
	window.addEventListener( 'resize', onResize, { passive: true } );
	onFrame();
} )();
