/**
 * Willow Scroll — one-time header detection.
 *
 * Loaded only for administrators, and only while the stored result is missing,
 * belongs to another theme, or lacks the current layout (desktop / mobile).
 * Measures the real page with the plugin's own styles switched off, then saves
 * the header selector and the elements that paint its background.
 */
( function () {
	'use strict';

	var cfg = window.willowScrollDetect;
	if ( ! cfg || ! window.fetch ) {
		return;
	}

	var layout = window.matchMedia( '(max-width: ' + cfg.breakpoint + 'px)' ).matches ? 'mobile' : 'desktop';
	var stored = cfg.detected && cfg.detected.theme === cfg.themeKey ? cfg.detected : null;
	var layoutKnown = !! stored && ( stored.layouts || [] ).indexOf( layout ) > -1;
	var colorsMissing = ( cfg.colorVars || [] ).some( function ( v ) {
		return ! stored || ! stored.colors || ! stored.colors[ v ];
	} );
	if ( layoutKnown && ! colorsMissing ) {
		return; // Already known for this theme and layout.
	}

	/** Theme colors defined as CSS variables (e.g. Astra's --ast-global-color-0), as used on the page. */
	function readColors() {
		var out = {};
		var cs = window.getComputedStyle( document.documentElement );
		( cfg.colorVars || [] ).forEach( function ( name ) {
			var v = cs.getPropertyValue( name ).trim();
			if ( v ) {
				out[ name ] = v;
			}
		} );
		return out;
	}

	// Classes that describe a state rather than the element; never stored.
	var STATE_CLASS = /^(is-|has-|willow-|wp-container-|wp-elements-|js-|elementor-sticky|sticky|scrolled|active|current|open|focus|hover)|(-active|-open|-fixed|-sticky|-scrolled|-hidden|-visible)$/i;

	function stableClasses( el ) {
		return Array.prototype.filter.call( el.classList, function ( c ) {
			return /^[A-Za-z_-][\w-]*$/.test( c ) && ! STATE_CLASS.test( c );
		} );
	}

	function alphaOf( color ) {
		if ( ! color || color === 'transparent' ) {
			return 0;
		}
		var m = color.match( /\(([^)]+)\)/ );
		if ( ! m ) {
			return 1;
		}
		var parts = m[ 1 ].split( /[\s,\/]+/ ).filter( Boolean );
		return parts.length < 4 ? 1 : parseFloat( parts[ 3 ] ) / ( parts[ 3 ].indexOf( '%' ) > -1 ? 100 : 1 );
	}

	function paints( el ) {
		var cs = window.getComputedStyle( el );
		return alphaOf( cs.backgroundColor ) > 0.01 || ( cs.backgroundImage && cs.backgroundImage !== 'none' );
	}

	function findHeader() {
		for ( var i = 0; i < cfg.candidates.length; i++ ) {
			var el = document.querySelector( cfg.candidates[ i ] );
			if ( el && el.getBoundingClientRect().height > 0 ) {
				return el;
			}
		}
		return null;
	}

	/** Unique selector for the header, or '' when nothing stable identifies it. */
	function headerSelector( header ) {
		if ( header.id && /^[A-Za-z][\w-]*$/.test( header.id ) && document.querySelectorAll( '#' + header.id ).length === 1 ) {
			return '#' + header.id;
		}
		var tag = header.tagName.toLowerCase();
		var classes = stableClasses( header );
		for ( var i = 0; i < classes.length; i++ ) {
			if ( document.querySelectorAll( tag + '.' + classes[ i ] ).length === 1 ) {
				return tag + '.' + classes[ i ];
			}
		}
		return '';
	}

	/**
	 * Painted, full-width layers inside the header: the deepest level wins,
	 * because that is the one the visitor sees. Empty = the header paints itself.
	 */
	function backgroundLayers( header ) {
		var hr = header.getBoundingClientRect();
		var minH = Math.max( 12, hr.height * 0.2 );
		function fullWidth( el ) {
			var r = el.getBoundingClientRect();
			return r.width >= hr.width * 0.9 && r.height >= minH;
		}
		var level = [ header ];
		var best = [];
		for ( var depth = 0; depth <= 5 && level.length; depth++ ) {
			var hits = level.filter( paints );
			if ( hits.length ) {
				best = hits;
			}
			var next = [];
			level.forEach( function ( el ) {
				Array.prototype.forEach.call( el.children, function ( c ) {
					if ( fullWidth( c ) ) {
						next.push( c );
					}
				} );
			} );
			level = next;
		}
		return best.filter( function ( el ) {
			return el !== header;
		} );
	}

	/**
	 * A class selector shared by every copy of this layer (e.g. desktop and
	 * mobile rows): the class with the most matches inside the header where
	 * every match paints a background. Falls back to a path from the header.
	 */
	function layerSelector( el, header ) {
		var tag = el.tagName.toLowerCase();
		var best = '';
		var bestCount = 0;
		stableClasses( el ).forEach( function ( c ) {
			var sel = tag + '.' + c;
			var matches = header.querySelectorAll( sel );
			var ok = matches.length <= 4 && Array.prototype.every.call( matches, paints );
			if ( ok && matches.length > bestCount ) {
				best = sel;
				bestCount = matches.length;
			}
		} );
		if ( best ) {
			return best;
		}
		var parts = [];
		for ( var n = el; n && n !== header; n = n.parentElement ) {
			var index = 1;
			for ( var sib = n.previousElementSibling; sib; sib = sib.previousElementSibling ) {
				if ( sib.tagName === n.tagName ) {
					index++;
				}
			}
			parts.unshift( n.tagName.toLowerCase() + ':nth-of-type(' + index + ')' );
		}
		return '> ' + parts.join( ' > ' );
	}

	/** Does the theme itself fix the header or lay it over the content? */
	function themeMovesHeader( header ) {
		var sticky = false;
		for ( var n = header; n && n !== document.body; n = n.parentElement ) {
			var pos = window.getComputedStyle( n ).position;
			if ( pos === 'sticky' || pos === 'fixed' ) {
				sticky = true;
			}
		}
		var own = window.getComputedStyle( header ).position;
		return { sticky: sticky, overlay: own === 'absolute' || own === 'fixed' };
	}

	function detect() {
		// Measure the theme, not the plugin: switch off Willow Scroll's own styles.
		var own = document.getElementById( 'willow-scroll-inline-css' );
		if ( own ) {
			own.disabled = true;
		}
		var result = null;
		try {
			var header = findHeader();
			if ( header ) {
				var layers = backgroundLayers( header ).map( function ( el ) {
					return layerSelector( el, header );
				} );
				var moves = themeMovesHeader( header );
				result = {
					header: headerSelector( header ),
					background: layers.filter( function ( v, i ) {
						return layers.indexOf( v ) === i;
					} ),
					themeSticky: moves.sticky,
					themeOverlay: moves.overlay,
				};
			}
		} finally {
			if ( own ) {
				own.disabled = false;
			}
		}
		return result;
	}

	function save( result ) {
		var bg = result ? result.background : [];
		var colors = Object.assign( {}, ( stored && stored.colors ) || {}, readColors() );
		var value = {
			colors: colors,
			theme: cfg.themeKey,
			header: ( stored && stored.header ) || ( result && result.header ) || '',
			layouts: [ layout ],
			themeSticky: !! ( result && result.themeSticky ) || !! ( stored && stored.themeSticky ),
			themeOverlay: !! ( result && result.themeOverlay ) || !! ( stored && stored.themeOverlay ),
			found: !! result || !! ( stored && stored.found ),
		};
		if ( stored ) {
			value.layouts = ( stored.layouts || [] ).concat( layoutKnown ? [] : layout );
			bg = ( stored.background ? stored.background.split( ', ' ) : [] ).concat( bg );
		}
		value.background = bg
			.filter( function ( v, i ) {
				return v && bg.indexOf( v ) === i;
			} )
			.join( ', ' );

		window.fetch( cfg.restUrl, {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce },
			body: JSON.stringify( { willow_scroll_detected: value } ),
		} );
	}

	function run() {
		// Give late layout (web fonts, lazy header scripts) a moment.
		setTimeout( function () {
			// Layout already known: only the theme colors are added.
			save( layoutKnown ? null : detect() );
		}, 800 );
	}

	if ( document.readyState === 'complete' ) {
		run();
	} else {
		window.addEventListener( 'load', run );
	}
} )();
