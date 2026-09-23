/**
 * Willow Scroll — settings page (wp.element + wp.components, no build step).
 * Follows the approved mockup: status navigation, sections with label/control rows.
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var useState = wp.element.useState;
	var useEffect = wp.element.useEffect;
	var __ = wp.i18n.__;
	var _n = wp.i18n._n;
	var sprintf = wp.i18n.sprintf;
	var C = wp.components;
	var apiFetch = wp.apiFetch;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;

	var ToggleGroup = C.ToggleGroupControl || C.__experimentalToggleGroupControl;
	var ToggleGroupOption = C.ToggleGroupControlOption || C.__experimentalToggleGroupControlOption;
	var ToggleGroupOptionIcon = C.ToggleGroupControlOptionIcon || C.__experimentalToggleGroupControlOptionIcon;

	var Controls = window.willowScrollControls;
	var SettingControl = Controls.SettingControl;
	var ColorGroup = Controls.ColorGroup;
	var BackgroundField = Controls.BackgroundField;
	var LogoField = Controls.LogoField;
	var LABELS = Controls.labels;
	var UNITS = Controls.units;
	var data = Controls.data;
	var page = window.willowScrollSettings || {};

	// Rules that target a taxonomy archive or a single term.
	function isTermTarget( slug ) {
		return /^(category|tag|taxonomy)(-|$)/.test( slug );
	}

	function asObject( v ) {
		return v && typeof v === 'object' && ! Array.isArray( v ) ? v : {};
	}

	/* ── Presets ───────────────────────────────────────────────────── */

	/*
	 * Presets set how the sticky header behaves and looks: visibility, background,
	 * blur, shadow, line, floating, shrink and motion. The header type, the regular
	 * header and the logos stay as they are. Colors come from the theme.
	 */
	var THEME = page.themeColors || { background: '#ffffff', text: '#111827' };
	function tint( hex, alpha ) {
		var h = ( hex || '#ffffff' ).replace( '#', '' );
		if ( h.length === 3 ) {
			h = h.replace( /(.)/g, '$1$1' );
		}
		var n = parseInt( h.slice( 0, 6 ), 16 );
		return 'rgba(' + ( ( n >> 16 ) & 255 ) + ',' + ( ( n >> 8 ) & 255 ) + ',' + ( n & 255 ) + ',' + alpha + ')';
	}
	var PRESET_BASE = {
		sticky: true, scroll_behavior: 'smart',
		scrolled_bg_enabled: true, scrolled_bg: tint( THEME.background, 1 ), blur: 0,
		shadow_enabled: false, shadow_color: 'rgba(0,0,0,0.1)', shadow_y: 4, shadow_blur: 24,
		line_enabled: false,
		float_enabled: false, float_inset_x: 12, float_inset_y: 12, float_radius: 16, float_corners: false,
		shrink_enabled: false, shrink_height: 64, logo_resize: false,
		transition_duration: 300, transition_easing: 'ease',
	};
	var PRESETS = [
		{ key: 'glass', label: __( 'Glass', 'willow-scroll' ), values: { scrolled_bg: tint( THEME.background, 0.72 ), blur: 20, shadow_enabled: true, shadow_color: 'rgba(0,0,0,0.08)' } },
		{ key: 'solid', label: __( 'Solid', 'willow-scroll' ), values: { shadow_enabled: true, shadow_color: 'rgba(0,0,0,0.08)', shadow_y: 2, shadow_blur: 12, shrink_enabled: true } },
		{ key: 'minimal', label: __( 'Minimal', 'willow-scroll' ), values: { scrolled_bg_enabled: false, transition_duration: 220 } },
		{ key: 'always', label: __( 'Always on top', 'willow-scroll' ), values: { scroll_behavior: 'always', line_enabled: true, shrink_enabled: true } },
		{ key: 'floating', label: __( 'Floating', 'willow-scroll' ), values: { scrolled_bg: tint( THEME.background, 0.85 ), blur: 16, shadow_enabled: true, shadow_color: 'rgba(0,0,0,0.12)', shadow_y: 8, shadow_blur: 30, float_enabled: true, float_inset_x: 12, float_inset_y: 12, float_radius: 16, float_corners: false } },
		{ key: 'dark', label: __( 'Dark glass', 'willow-scroll' ), values: { scrolled_bg: tint( THEME.text, 0.7 ), blur: 20, shadow_enabled: true, shadow_color: 'rgba(0,0,0,0.25)' } },
		{ key: 'compact', label: __( 'Compact', 'willow-scroll' ), values: { line_enabled: true, shrink_enabled: true, shrink_height: 52, logo_resize: true, logo_height_default: 48, logo_height_scrolled: 30 } },
	];
	function presetValues( p ) {
		return Object.assign( {}, PRESET_BASE, p.values );
	}
	function activePreset( values ) {
		return PRESETS.filter( function ( p ) {
			var pv = presetValues( p );
			return Object.keys( pv ).every( function ( k ) {
				return values[ k ] === pv[ k ];
			} );
		} )[ 0 ];
	}

	/* ── Icons (static, decorative) ────────────────────────────────── */

	function Icon( props ) {
		return el( 'svg', { className: 'ws-nav__icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, props.children );
	}
	var ICONS = {
		// A page with its header bar.
		header: el( Icon, null, el( 'rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 } ), el( 'path', { d: 'M3 9.5h18' } ) ),
		// Half-filled circle: the two looks of the header.
		appearance: el( Icon, null, el( 'circle', { cx: 12, cy: 12, r: 8 } ), el( 'path', { d: 'M12 4a8 8 0 0 1 0 16z', className: 'is-fill' } ) ),
		// Arrows pulled inwards.
		shrink: el( Icon, null, el( 'path', { d: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' } ) ),
		// A layout split into areas.
		templates: el( Icon, null, el( 'rect', { x: 3, y: 3, width: 7, height: 18, rx: 1.5 } ), el( 'rect', { x: 14, y: 3, width: 7, height: 8, rx: 1.5 } ), el( 'rect', { x: 14, y: 15, width: 7, height: 6, rx: 1.5 } ) ),
		// Sliders: the optional helpers.
		extras: el(
			Icon,
			null,
			el( 'path', { d: 'M4 8h8M17 8h3M4 16h3M12 16h8' } ),
			el( 'circle', { cx: 14.5, cy: 8, r: 2.2 } ),
			el( 'circle', { cx: 9.5, cy: 16, r: 2.2 } )
		),
	};

	function Mark() {
		var tile = 'M16 0C28.8 0 32 3.2 32 16S28.8 32 16 32 0 28.8 0 16 3.2 0 16 0Z';
		return el(
			'svg',
			{ className: 'ws-topbar__mark', viewBox: '0 0 32 32', width: 28, height: 28, 'aria-hidden': 'true', focusable: 'false' },
			el( 'defs', null, el( 'clipPath', { id: 'ws-mark-tile' }, el( 'path', { d: tile } ) ) ),
			el( 'path', { d: tile, fill: 'currentColor' } ),
			el(
				'g',
				{ clipPath: 'url(#ws-mark-tile)' },
				el( 'path', { d: 'M5.5 10.5C7.6 10.5 8.2 22.5 10.6 22.5S13.6 14 15.4 14 17.7 22.5 19.9 22.5C22.5 22.5 25.1 13.5 31 0', fill: 'none', stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' } )
			)
		);
	}

	/* ── Layout primitives ─────────────────────────────────────────── */

	var uid = 0;
	function useId( prefix ) {
		var v = useState( function () {
			uid += 1;
			return prefix + '-' + uid;
		} );
		return v[ 0 ];
	}

	function PageHeader( props ) {
		return el(
			'div',
			{ className: 'ws-page-head' },
			el( 'h2', null, props.title ),
			el( 'p', null, props.description )
		);
	}

	/**
	 * Section: heading (+ switch on the right), rows, optional "advanced" group.
	 * With `toggle`, rows show only when it is on.
	 */
	function Section( props ) {
		var id = useId( 'ws-section' );
		var on = ! props.toggle || props.toggle.checked;
		var rows = [].concat( props.children || [] ).filter( Boolean );

		return el(
			'section',
			{ className: 'ws-section' + ( on ? '' : ' is-off' ), 'aria-labelledby': id },
			el(
				'div',
				{ className: 'ws-s-head' },
				el( 'div', null, el( 'h3', { id: id }, props.title ), props.description && el( 'p', null, props.description ) ),
				props.toggle &&
					el( C.FormToggle, {
						checked: !! props.toggle.checked,
						'aria-labelledby': id,
						onChange: function () {
							props.toggle.onChange( ! props.toggle.checked );
						},
					} ),
				props.actions
			),
			on && rows.length > 0 && el( 'div', { className: 'ws-rows' }, rows ),
			// A section made only of advanced settings needs no disclosure: its own
			// heading already says what is inside.
			on && props.advanced && rows.length === 0 && el( 'div', { className: 'ws-rows' }, props.advanced ),
			on && props.advanced && rows.length > 0 && el( Advanced, null, props.advanced )
		);
	}

	function Row( props ) {
		return el(
			'div',
			{ className: 'ws-row' },
			el(
				'div',
				{ className: 'ws-row__l' },
				el( props.htmlFor ? 'label' : 'span', { className: 'ws-row__t', htmlFor: props.htmlFor }, props.label ),
				props.help && el( 'p', null, props.help )
			),
			el( 'div', { className: 'ws-row__c' }, props.children )
		);
	}

	function Advanced( props ) {
		var open = useState( false );
		var id = useId( 'ws-advanced' );
		return el(
			'div',
			{ className: 'ws-adv' + ( open[ 0 ] ? ' is-open' : '' ) },
			el(
				C.Button,
				{
					variant: 'link',
					className: 'ws-adv__toggle',
					icon: open[ 0 ] ? 'arrow-up-alt2' : 'arrow-down-alt2',
					iconPosition: 'right',
					iconSize: 14,
					'aria-expanded': open[ 0 ],
					'aria-controls': id,
					onClick: function () {
						open[ 1 ]( ! open[ 0 ] );
					},
				},
				open[ 0 ] ? __( 'Hide advanced settings', 'willow-scroll' ) : __( 'Show advanced settings', 'willow-scroll' )
			),
			open[ 0 ] && el( 'div', { className: 'ws-rows', id: id }, props.children )
		);
	}

	function Segmented( props ) {
		if ( ! ToggleGroup || ! ToggleGroupOption ) {
			return el( SettingControl, { name: props.name, value: props.value, hideLabel: true, onChange: props.onChange } );
		}
		return el(
			ToggleGroup,
			{
				className: 'ws-seg',
				label: props.label,
				hideLabelFromVision: true,
				value: props.value,
				isBlock: true,
				onChange: function ( v ) {
					props.onChange( props.name, v );
				},
				__nextHasNoMarginBottom: true,
				__next40pxDefaultSize: true,
			},
			props.options.map( function ( o ) {
				return el( ToggleGroupOption, { key: o.value, value: o.value, label: o.label } );
			} )
		);
	}

	/**
	 * Arrow icon picker: native segmented control with icon options.
	 */
	function IconPicker( props ) {
		var icons = data.sttIcons || {};
		var labels = ( Controls.enums && Controls.enums.stt_icon_style ) || {};
		if ( ! ToggleGroup || ! ToggleGroupOptionIcon ) {
			return el( SettingControl, { name: 'stt_icon_style', value: props.value, hideLabel: true, onChange: props.onChange } );
		}
		return el(
			ToggleGroup,
			{
				className: 'ws-seg ws-icon-picker',
				label: LABELS.stt_icon_style,
				hideLabelFromVision: true,
				value: props.value,
				isBlock: true,
				onChange: function ( v ) {
					props.onChange( 'stt_icon_style', v );
				},
				__nextHasNoMarginBottom: true,
				__next40pxDefaultSize: true,
			},
			Object.keys( icons ).map( function ( key ) {
				var filled = icons[ key ].filled;
				return el( ToggleGroupOptionIcon, {
					key: key,
					value: key,
					label: labels[ key ] || key,
					icon: el( 'svg', {
						viewBox: '0 0 24 24',
						width: 24,
						height: 24,
						fill: filled ? 'currentColor' : 'none',
						stroke: 'currentColor',
						strokeWidth: 2.2,
						strokeLinecap: 'round',
						strokeLinejoin: 'round',
						'aria-hidden': 'true',
						dangerouslySetInnerHTML: { __html: icons[ key ].svg },
					} ),
				} );
			} )
		);
	}

	function Notices() {
		var notices = useSelect( function ( select ) {
			return select( 'core/notices' ).getNotices().filter( function ( n ) {
				return n.type === 'snackbar';
			} );
		}, [] );
		var removeNotice = useDispatch( 'core/notices' ).removeNotice;
		return el( C.SnackbarList, { className: 'ws-snackbars', notices: notices, onRemove: removeNotice } );
	}

	/* ── App ───────────────────────────────────────────────────────── */

	var HEADER_HELP = {
		flow: __( 'Sits above the content, like on most sites.', 'willow-scroll' ),
		overlay: __( 'Lies on top of the first section and stays see-through until the visitor scrolls. For pages that start with a large image.', 'willow-scroll' ),
	};
	var VISIBILITY_HELP = {
		smart: __( 'Slides away while scrolling down, returns as soon as the visitor scrolls up.', 'willow-scroll' ),
		always: __( 'Stays on screen all the time.', 'willow-scroll' ),
		hide: __( 'Slides away while scrolling down, returns near the top of the page.', 'willow-scroll' ),
	};
	var VISIBILITY_META = {
		smart: __( 'smart', 'willow-scroll' ),
		always: __( 'always visible', 'willow-scroll' ),
		hide: __( 'hides', 'willow-scroll' ),
	};

	function App() {
		var initial = { settings: data.global, templates: asObject( page.overrides ) };
		var stateV = useState( initial );
		var savedV = useState( initial );
		var busyV = useState( false );
		var tabV = useState( 'header' );
		var detectedV = useState( asObject( page.detected ) );
		var clearingV = useState( false );
		var pickV = useState( '' );
		var openRulesV = useState( {} );
		var notices = useDispatch( 'core/notices' );

		var state = stateV[ 0 ];
		var values = state.settings;
		var templates = state.templates;
		var dirty = JSON.stringify( state ) !== JSON.stringify( savedV[ 0 ] );

		useEffect(
			function () {
				function warn( e ) {
					if ( dirty ) {
						e.preventDefault();
						e.returnValue = '';
					}
				}
				window.addEventListener( 'beforeunload', warn );
				return function () {
					window.removeEventListener( 'beforeunload', warn );
				};
			},
			[ dirty ]
		);

		// Picks up a result saved meanwhile by the site visit (detection runs on the site).
		function refreshDetection() {
			apiFetch( { path: '/wp/v2/settings' } ).then( function ( res ) {
				detectedV[ 1 ]( asObject( res.willow_scroll_detected ) );
			} );
		}
		useEffect( function () {
			window.addEventListener( 'focus', refreshDetection );
			return function () {
				window.removeEventListener( 'focus', refreshDetection );
			};
		}, [] );

		// Forget the result; the next admin visit to the site detects again.
		function detectAgain() {
			clearingV[ 1 ]( true );
			apiFetch( { path: '/wp/v2/settings', method: 'POST', data: { willow_scroll_detected: {} } } )
				.then( function () {
					detectedV[ 1 ]( {} );
					window.open( page.homeUrl, '_blank', 'noopener' );
				} )
				.finally( function () {
					clearingV[ 1 ]( false );
				} );
		}

		function patch( p ) {
			stateV[ 1 ]( function ( prev ) {
				return { settings: Object.assign( {}, prev.settings, p ), templates: prev.templates };
			} );
		}
		function set( name, v ) {
			var p = {};
			p[ name ] = v;
			patch( p );
		}
		function setTemplates( next ) {
			stateV[ 1 ]( function ( prev ) {
				return { settings: prev.settings, templates: next };
			} );
		}
		function toggle( name ) {
			return {
				checked: !! values[ name ],
				onChange: function ( v ) {
					set( name, v );
				},
			};
		}

		/* Row builders */

		function row( name, opts ) {
			opts = opts || {};
			var def = data.schema[ name ] || {};
			var label = opts.label || LABELS[ name ] || name;
			var unit = UNITS[ name ];
			var id = 'ws-field-' + name;

			if ( def.type === 'bool' ) {
				return el(
					Row,
					{ key: name, label: label, help: opts.help, htmlFor: id },
					el( C.FormToggle, {
						id: id,
						checked: !! values[ name ],
						onChange: function () {
							set( name, ! values[ name ] );
						},
					} )
				);
			}
			return el(
				Row,
				{ key: name, label: unit ? label + ' (' + unit + ')' : label, help: opts.help },
				el( SettingControl, { name: name, value: values[ name ], onChange: set, hideLabel: true, label: label, placeholder: opts.placeholder } )
			);
		}

		function colorRow( names, label, help ) {
			var list = names.filter( Boolean );
			var labels = null;
			if ( list.length === 1 ) {
				labels = {};
				labels[ list[ 0 ] ] = values[ list[ 0 ] ];
			}
			return el(
				Row,
				{ key: list.join( '-' ), label: label, help: help },
				el( ColorGroup, { names: list, values: values, labels: labels, onChange: set } )
			);
		}

		function backgroundRow( name, label, help, allowNone ) {
			return el(
				Row,
				{ key: name, label: label, help: help },
				el( BackgroundField, {
					label: label,
					value: values[ name ],
					defaultValue: allowNone ? undefined : data.schema[ name ].default,
					allowNone: allowNone,
					onChange: function ( v ) {
						set( name, v );
					},
				} )
			);
		}

		function logoRow( name, help ) {
			return el(
				Row,
				{ key: name, label: LABELS[ name ], help: help },
				el( LogoField, {
					value: values[ name ],
					onChange: function ( id ) {
						set( name, id );
					},
				} )
			);
		}

		function segRow( name, label, help, options ) {
			return el(
				Row,
				{ key: name, label: label, help: help },
				el( Segmented, { name: name, label: label, value: values[ name ], onChange: set, options: options } )
			);
		}

		function save() {
			// Send only keys the REST schema knows about.
			var clean = {};
			Object.keys( data.schema ).forEach( function ( k ) {
				if ( state.settings[ k ] !== undefined ) {
					clean[ k ] = state.settings[ k ];
				}
			} );
			busyV[ 1 ]( true );
			apiFetch( { path: '/wp/v2/settings', method: 'POST', data: { willow_scroll_settings: clean, willow_scroll_templates: state.templates } } )
				.then( function ( res ) {
					var next = { settings: res.willow_scroll_settings || state.settings, templates: asObject( res.willow_scroll_templates ) };
					stateV[ 1 ]( next );
					savedV[ 1 ]( next );
					notices.createSuccessNotice( __( 'Settings saved.', 'willow-scroll' ), { type: 'snackbar' } );
				} )
				.catch( function ( err ) {
					// REST puts the field-level reason into data.params.
					var detail = err && err.data && err.data.params ? Object.values( err.data.params ).join( ' ' ) : '';
					notices.createErrorNotice( ( ( err && err.message ) || __( 'Settings could not be saved.', 'willow-scroll' ) ) + ( detail ? ' ' + detail : '' ), { type: 'snackbar' } );
				} )
				.finally( function () {
					busyV[ 1 ]( false );
				} );
		}

		var HEADER_OPTIONS = [
			{ value: 'flow', label: __( 'Regular', 'willow-scroll' ) },
			{ value: 'overlay', label: __( 'Transparent', 'willow-scroll' ) },
		];

		/* Templates */

		var titles = {};
		( page.templates || [] ).forEach( function ( t ) {
			titles[ t.slug ] = t.title;
		} );
		var available = ( page.templates || [] ).filter( function ( t ) {
			return ! templates[ t.slug ];
		} );

		function updateTemplate( slug, next ) {
			var all = Object.assign( {}, templates );
			if ( next ) {
				all[ slug ] = next;
			} else {
				delete all[ slug ];
			}
			setTemplates( all );
		}

		// Short summary of what a rule changes, for the collapsed card.
		function ruleSummary( rule ) {
			var parts = [];
			if ( rule.header_mode !== undefined ) {
				parts.push( rule.header_mode === 'overlay' ? __( 'transparent', 'willow-scroll' ) : __( 'regular', 'willow-scroll' ) );
			}
			if ( rule.sticky !== undefined ) {
				parts.push( rule.sticky ? __( 'sticky', 'willow-scroll' ) : __( 'not sticky', 'willow-scroll' ) );
			}
			if ( rule.regular_bg !== undefined || rule.scrolled_bg !== undefined ) {
				parts.push( __( 'background', 'willow-scroll' ) );
			}
			if ( rule.logo_regular_id !== undefined || rule.logo_transparent_id !== undefined || rule.logo_sticky_id !== undefined ) {
				parts.push( __( 'logo', 'willow-scroll' ) );
			}
			if ( rule.posts ) {
				parts.push( __( 'posts too', 'willow-scroll' ) );
			}
			return parts.length ? parts.join( ', ' ) : __( 'nothing changed yet', 'willow-scroll' );
		}

		function moveRule( slug, delta ) {
			var keys = Object.keys( templates );
			var at = keys.indexOf( slug );
			var to = at + delta;
			if ( at < 0 || to < 0 || to >= keys.length ) {
				return;
			}
			keys.splice( to, 0, keys.splice( at, 1 )[ 0 ] );
			var ordered = {};
			keys.forEach( function ( k ) {
				ordered[ k ] = templates[ k ];
			} );
			setTemplates( ordered );
		}

		function templateCard( slug ) {
			var title = titles[ slug ] || slug;
			var rule = templates[ slug ] || {};
			var keys = Object.keys( templates );
			var index = keys.indexOf( slug );
			var open = !! openRulesV[ 0 ][ slug ];
			var inheritedValues = {};
			Object.keys( values ).forEach( function ( k ) {
				inheritedValues[ k ] = values[ k ];
			} );

			function toggleOpen() {
				var next = Object.assign( {}, openRulesV[ 0 ] );
				next[ slug ] = ! open;
				openRulesV[ 1 ]( next );
			}

			return el(
				Section,
				{
					key: slug,
					title: title,
					description: slug + ' — ' + ruleSummary( templates[ slug ] || {} ),
					actions: el(
						'div',
						{ className: 'ws-rule-actions' },
						keys.length > 1 &&
							el( C.Button, {
								variant: 'tertiary',
								icon: 'arrow-up-alt',
								iconSize: 16,
								label: __( 'Move up', 'willow-scroll' ),
								disabled: index === 0,
								onClick: function () {
									moveRule( slug, -1 );
								},
							} ),
						keys.length > 1 &&
							el( C.Button, {
								variant: 'tertiary',
								icon: 'arrow-down-alt',
								iconSize: 16,
								label: __( 'Move down', 'willow-scroll' ),
								disabled: index === keys.length - 1,
								onClick: function () {
									moveRule( slug, 1 );
								},
							} ),
						el(
							C.Button,
							{
								variant: 'tertiary',
								icon: open ? 'arrow-up-alt2' : 'arrow-down-alt2',
								iconPosition: 'right',
								iconSize: 14,
								'aria-expanded': open,
								onClick: toggleOpen,
							},
							open ? __( 'Close', 'willow-scroll' ) : __( 'Edit', 'willow-scroll' )
						),
						el(
							C.Button,
							{
								variant: 'tertiary',
								isDestructive: true,
								onClick: function () {
									updateTemplate( slug, null );
								},
							},
							__( 'Remove', 'willow-scroll' )
						)
					),
				},
				isTermTarget( slug ) &&
					open &&
					el(
						Row,
						{
							key: 'posts',
							label: __( 'Apply to posts as well', 'willow-scroll' ),
							help: rule.posts
								? __( 'Posts in this term use this rule too. A post in several terms takes the rule that is higher in the list; a post can still override it in the editor.', 'willow-scroll' )
								: __( 'Only the archive page of this term uses the rule.', 'willow-scroll' ),
							htmlFor: 'ws-rule-posts-' + slug,
						},
						el( C.FormToggle, {
							id: 'ws-rule-posts-' + slug,
							checked: !! rule.posts,
							onChange: function () {
								var next = Object.assign( {}, rule );
								next.posts = ! rule.posts;
								next.override = true;
								updateTemplate( slug, next );
							},
						} )
					),
				open &&
					el(
						'div',
						{ key: 'fields', className: 'ws-template-fields' },
						el( Controls.OverrideFields, {
							value: templates[ slug ],
							inherited: { values: inheritedValues, sources: {}, template: '' },
							toggle: false,
							onChange: function ( next ) {
								updateTemplate( slug, next );
							},
						} )
					)
			);
		}

		/* Tabs */

		var hides = values.sticky && values.scroll_behavior !== 'always';
		var preset = activePreset( values );
		var templateCount = Object.keys( templates ).length;
		var extrasOn = [ values.progress_bar, values.stt_enabled, values.csb_enabled ].filter( Boolean ).length;

		var NAV = [
			{
				name: 'header',
				title: __( 'Header', 'willow-scroll' ),
				meta: ( values.header_mode === 'overlay' ? __( 'Transparent', 'willow-scroll' ) : __( 'Regular', 'willow-scroll' ) ) + ', ' + ( values.sticky ? VISIBILITY_META[ values.scroll_behavior ] : __( 'not sticky', 'willow-scroll' ) ),
			},
			{ name: 'appearance', title: __( 'Appearance', 'willow-scroll' ), meta: preset ? preset.label : __( 'Custom', 'willow-scroll' ) },
			{ name: 'shrink', title: __( 'Shrink & logo', 'willow-scroll' ), meta: values.shrink_enabled ? __( 'Shrinks on scroll', 'willow-scroll' ) : __( 'Off', 'willow-scroll' ) },
		];
		NAV.push( {
			name: 'templates',
			title: __( 'Templates', 'willow-scroll' ),
			meta: templateCount ? sprintf( _n( '%d rule', '%d rules', templateCount, 'willow-scroll' ), templateCount ) : __( 'None', 'willow-scroll' ),
		} );
		NAV.push( {
			name: 'extras',
			title: __( 'Extras', 'willow-scroll' ),
			meta: extrasOn ? sprintf( __( '%d of 3 on', 'willow-scroll' ), extrasOn ) : __( 'All off', 'willow-scroll' ),
		} );

		var tab = tabV[ 0 ];
		var panels = {
			header: function () {
				return [
					el( PageHeader, { key: 'h', title: __( 'Header', 'willow-scroll' ), description: __( 'Where the header sits and how it reacts while the visitor scrolls.', 'willow-scroll' ) } ),
					el(
						Section,
						{ key: 'preset', title: __( 'Starting point', 'willow-scroll' ), description: __( 'Sets how the sticky header behaves and looks: visibility, background, blur, shadow, line, floating and shrink, in the colors of your theme. The header type, the regular header and the logos stay as they are.', 'willow-scroll' ) },
						el(
							'div',
							{ key: 'presets', className: 'ws-pills', role: 'group', 'aria-label': __( 'Presets', 'willow-scroll' ) },
							PRESETS.map( function ( p ) {
								var on = preset && preset.key === p.key;
								return el(
									C.Button,
									{
										key: p.key,
										className: 'ws-pill' + ( on ? ' is-on' : '' ),
										isPressed: on,
										onClick: function () {
											patch( presetValues( p ) );
										},
									},
									p.label
								);
							} )
						)
					),
					el(
						Section,
						{ key: 'behavior', title: __( 'Behavior', 'willow-scroll' ) },
						segRow( 'header_mode', __( 'Header', 'willow-scroll' ), HEADER_HELP[ values.header_mode ], HEADER_OPTIONS ),
						row( 'sticky', { label: __( 'Sticky', 'willow-scroll' ), help: values.sticky ? __( 'Follows the visitor down the page.', 'willow-scroll' ) : __( 'Scrolls away with the page.', 'willow-scroll' ) } ),
						values.sticky && segRow( 'scroll_behavior', __( 'Visibility', 'willow-scroll' ), VISIBILITY_HELP[ values.scroll_behavior ], [
							{ value: 'smart', label: __( 'Smart', 'willow-scroll' ) },
							{ value: 'always', label: __( 'Always', 'willow-scroll' ) },
							{ value: 'hide', label: __( 'Hide', 'willow-scroll' ) },
						] )
					),
					el(
						Section,
						{ key: 'motion', title: __( 'Motion', 'willow-scroll' ), description: __( 'Turned off automatically for visitors who prefer reduced motion.', 'willow-scroll' ) },
						row( 'transition_duration' ),
						row( 'transition_easing' )
					),
					el(
						Section,
						{ key: 'mobile', title: __( 'Small screens', 'willow-scroll' ) },
						row( 'mobile_breakpoint', { label: __( 'Breakpoint', 'willow-scroll' ) } ),
						row( 'disable_on_mobile', { label: __( 'Keep the theme header', 'willow-scroll' ), help: __( 'Below the breakpoint the header behaves as in your theme.', 'willow-scroll' ) } )
					),
					( function () {
						var d = detectedV[ 0 ];
						var current = d.theme === page.themeKey;
						var status = ! current
							? __( 'Not found yet. Open your site once while logged in, and the header will be found on that visit.', 'willow-scroll' )
							: d.found
							? __( 'Header found automatically.', 'willow-scroll' )
							: __( 'Couldn’t find the header automatically. Enter its class below.', 'willow-scroll' );

						return el(
							Section,
							{
								key: 'detect',
								title: __( 'Header detection', 'willow-scroll' ),
								description: sprintf( __( 'Found automatically on your site and reused on every page. Runs again when %s or its version changes.', 'willow-scroll' ), page.themeName ),
								actions: el(
									C.Button,
									{ variant: 'secondary', isBusy: clearingV[ 0 ], disabled: clearingV[ 0 ], onClick: detectAgain },
									current ? __( 'Detect again', 'willow-scroll' ) : __( 'Open site', 'willow-scroll' )
								),
							},
							el( C.Notice, { key: 'status', status: current && d.found ? 'success' : current ? 'warning' : 'info', isDismissible: false, className: 'ws-notice' }, status ),
							current && ( d.themeSticky || d.themeOverlay ) &&
								el(
									C.Notice,
									{ key: 'conflict', status: 'warning', isDismissible: false, className: 'ws-notice' },
									sprintf(
										/* translators: 1: theme name, 2: "sticky" and/or "transparent" */
										__( '%1$s already makes its header %2$s by itself. Turn that off in the theme’s header settings, otherwise the theme and Willow Scroll will both move and paint the header.', 'willow-scroll' ),
										page.themeName,
										[ d.themeSticky && __( 'sticky', 'willow-scroll' ), d.themeOverlay && __( 'transparent', 'willow-scroll' ) ].filter( Boolean ).join( __( ' and ', 'willow-scroll' ) )
									)
								),
							current && d.found &&
								el(
									Row,
									{ key: 'dh', label: __( 'Detected header', 'willow-scroll' ) },
									el( 'code', { className: 'ws-code' }, d.header || __( 'Theme header', 'willow-scroll' ) )
								),
							current && d.found &&
								el(
									Row,
									{ key: 'db', label: __( 'Background painted on', 'willow-scroll' ) },
									d.background
										? el(
												'div',
												{ className: 'ws-code-list' },
												d.background.split( ', ' ).map( function ( sel ) {
													return el( 'code', { key: sel, className: 'ws-code' }, sel );
												} )
										  )
										: el( 'code', { className: 'ws-code' }, __( 'The header itself', 'willow-scroll' ) )
								),
							row( 'selector', {
								label: __( 'Header class', 'willow-scroll' ),
								placeholder: ( current && d.header ) || ( page.isBlockTheme ? 'header.wp-block-template-part' : '#masthead' ),
								help: __( 'Leave empty to use the detected header. A class, id or any CSS selector.', 'willow-scroll' ),
							} ),
							row( 'background_selector', {
								label: __( 'Background elements', 'willow-scroll' ),
								placeholder: ( current && d.background ) || '.header-inner',
								help: __( 'Leave empty to use the detected elements. Classes inside the header, separated by commas.', 'willow-scroll' ),
							} )
						);
					} )(),
					el( Section, {
						key: 'fine',
						title: __( 'Fine-tuning', 'willow-scroll' ),
						description: __( 'Scroll thresholds and stacking. The defaults suit most sites.', 'willow-scroll' ),
						advanced: [
							hides && row( 'hide_after', { help: __( '0 uses the header height.', 'willow-scroll' ) } ),
							hides && row( 'scroll_tolerance', { help: __( 'Ignores small scroll movements.', 'willow-scroll' ) } ),
							row( 'scrolled_offset', { help: __( 'When the sticky look kicks in.', 'willow-scroll' ) } ),
							row( 'z_index' ),
						],
					} ),
				];
			},

			appearance: function () {
				return [
					el( PageHeader, { key: 'h', title: __( 'Appearance', 'willow-scroll' ), description: __( 'How the header looks at the top of the page and once it sticks to the top: background, blur, shadow, line and the floating look.', 'willow-scroll' ) } ),
					el(
						Section,
						{
							key: 'regular',
							title: __( 'Regular header', 'willow-scroll' ),
							description: __( 'The header at the top of the page when it is not transparent. Leave empty to keep the theme’s background.', 'willow-scroll' ),
						},
						backgroundRow( 'regular_bg', __( 'Background', 'willow-scroll' ), __( 'A color or a gradient.', 'willow-scroll' ), true )
					),
					el(
						Section,
						{
							key: 'sticky',
							title: __( 'Sticky header', 'willow-scroll' ),
							description: __( 'Background, blur and shadow of the header while it follows the visitor down the page.', 'willow-scroll' ),
							toggle: toggle( 'scrolled_bg_enabled' ),
						},
						backgroundRow(
							'scrolled_bg',
							__( 'Background', 'willow-scroll' ),
							values.scrolled_bg ? __( 'A color or a gradient.', 'willow-scroll' ) : __( 'No background chosen, so the theme’s own background stays. Pick a color or a gradient.', 'willow-scroll' ),
							false
						),
						row( 'blur', { help: __( 'Blurs the content behind a semi-transparent background.', 'willow-scroll' ) } ),
						row( 'shadow_enabled' ),
						values.shadow_enabled && colorRow( [ 'shadow_color' ], __( 'Shadow color', 'willow-scroll' ) ),
						values.shadow_enabled && row( 'shadow_y' ),
						values.shadow_enabled && row( 'shadow_blur' ),
						row( 'line_enabled', { help: __( 'A thin line at the bottom, instead of or next to the shadow.', 'willow-scroll' ) } ),
						values.line_enabled && colorRow( [ 'line_color' ], __( 'Line color', 'willow-scroll' ) ),
						values.line_enabled && row( 'line_width' ),
						row( 'float_enabled', { help: __( 'The sticky header moves away from the screen edges and gets rounded corners.', 'willow-scroll' ) } ),
						values.float_enabled && row( 'float_inset_x' ),
						values.float_enabled && row( 'float_inset_y' ),
						values.float_enabled && ! values.float_corners &&
							el(
								Row,
								{ key: 'float_radius', label: __( 'Corner radius (px)', 'willow-scroll' ) },
								el(
									'div',
									{ className: 'ws-stack' },
									el( SettingControl, { name: 'float_radius', value: values.float_radius, onChange: set, hideLabel: true, label: __( 'Corner radius', 'willow-scroll' ) } ),
									el(
										C.Button,
										{
											variant: 'link',
											className: 'ws-inline-action',
											onClick: function () {
												set( 'float_corners', true );
											},
										},
										__( 'Set each corner separately', 'willow-scroll' )
									)
								)
							),
						values.float_enabled && values.float_corners &&
							el(
								Row,
								{ key: 'float_corners', label: __( 'Corner radius (px)', 'willow-scroll' ) },
								el(
									'div',
									{ className: 'ws-stack' },
									[ 'float_radius_tl', 'float_radius_tr', 'float_radius_br', 'float_radius_bl' ].map( function ( name ) {
										return el( SettingControl, { key: name, name: name, value: values[ name ], onChange: set } );
									} ),
									el(
										C.Button,
										{
											variant: 'link',
											className: 'ws-inline-action',
											onClick: function () {
												set( 'float_corners', false );
											},
										},
										__( 'Use one radius for all corners', 'willow-scroll' )
									)
								)
							)
					),
				];
			},

			shrink: function () {
				return [
					el( PageHeader, { key: 'h', title: __( 'Shrink & logo', 'willow-scroll' ), description: __( 'Make the header more compact once the visitor scrolls, and pick a logo for each look.', 'willow-scroll' ) } ),
					el(
						Section,
						{ key: 'shrink', title: __( 'Shrink', 'willow-scroll' ), description: __( 'Makes the sticky header lower than the header at the top.', 'willow-scroll' ), toggle: toggle( 'shrink_enabled' ) },
						row( 'shrink_height', { help: __( 'The header never gets smaller than its logo and menu need. Works with themes that set the row height as well as with padding.', 'willow-scroll' ) } )
					),
					el(
						Section,
						{ key: 'logo', title: __( 'Logo', 'willow-scroll' ), description: __( 'A logo for each look of the header. All use your site logo until you pick another one. Templates and pages can have their own.', 'willow-scroll' ) },
						logoRow( 'logo_regular_id' ),
						logoRow( 'logo_transparent_id', __( 'Usually a light version over a photo.', 'willow-scroll' ) ),
						logoRow( 'logo_sticky_id', __( 'Match it to the sticky background: light on dark, dark on light.', 'willow-scroll' ) )
					),
					el(
						Section,
						{ key: 'size', title: __( 'Logo size', 'willow-scroll' ), description: __( 'Scales the site logo between the two states.', 'willow-scroll' ), toggle: toggle( 'logo_resize' ) },
						row( 'logo_height_default', { label: __( 'Height at the top', 'willow-scroll' ) } ),
						row( 'logo_height_scrolled', { label: __( 'Height when sticky', 'willow-scroll' ) } )
					),
				];
			},

			templates: function () {
				return [
					el( PageHeader, { key: 'h', title: __( 'Templates', 'willow-scroll' ), description: __( 'Header settings for a type of content: the front page, all posts of a post type, an archive, a custom template. A rule applies to everything that WordPress would render with that template, even if the theme has no separate file for it. The most specific rule wins, and settings on an individual page take priority.', 'willow-scroll' ) } ),
					el(
						Section,
						{ key: 'add', title: __( 'Add a rule', 'willow-scroll' ), description: __( 'Only what you change in a rule differs from the site settings. A rule for a category or a tag covers its archive page, and the posts in it when you turn that on. When several rules fit, the one higher in the list wins.', 'willow-scroll' ) },
						el(
							Row,
							{ key: 'pick', label: __( 'Template', 'willow-scroll' ) },
							el(
								'div',
								{ className: 'ws-inline' },
								el( C.SelectControl, {
									label: __( 'Template', 'willow-scroll' ),
									hideLabelFromVision: true,
									value: pickV[ 0 ],
									options: [ { value: '', label: available.length ? __( 'Choose what it applies to…', 'willow-scroll' ) : __( 'Everything has a rule', 'willow-scroll' ) } ].concat(
										available.map( function ( t ) {
											return { value: t.slug, label: t.title };
										} )
									),
									onChange: pickV[ 1 ],
									__nextHasNoMarginBottom: true,
									__next40pxDefaultSize: true,
								} ),
								el(
									C.Button,
									{
										variant: 'secondary',
										disabled: ! pickV[ 0 ],
										__next40pxDefaultSize: true,
										onClick: function () {
											updateTemplate( pickV[ 0 ], { override: false } );
											var opened = Object.assign( {}, openRulesV[ 0 ] );
											opened[ pickV[ 0 ] ] = true;
											openRulesV[ 1 ]( opened );
											pickV[ 1 ]( '' );
										},
									},
									__( 'Add', 'willow-scroll' )
								)
							)
						)
					),
				].concat( Object.keys( templates ).map( templateCard ) );
			},

			extras: function () {
				return [
					el( PageHeader, { key: 'h', title: __( 'Extras', 'willow-scroll' ), description: __( 'Optional helpers. Each works on its own, also where header effects are turned off.', 'willow-scroll' ) } ),
					el(
						Section,
						{ key: 'pb', title: __( 'Reading progress', 'willow-scroll' ), description: __( 'A thin bar showing how far the page is read.', 'willow-scroll' ), toggle: toggle( 'progress_bar' ) },
						colorRow( [ 'progress_bar_color' ], __( 'Color', 'willow-scroll' ) ),
						row( 'progress_bar_height' ),
						segRow( 'progress_bar_position', __( 'Position', 'willow-scroll' ), null, [
							{ value: 'top', label: __( 'Top', 'willow-scroll' ) },
							{ value: 'bottom', label: __( 'Bottom', 'willow-scroll' ) },
						] )
					),
					el(
						Section,
						{
							key: 'stt',
							title: __( 'Scroll to top', 'willow-scroll' ),
							description: __( 'A button that brings the visitor back up.', 'willow-scroll' ),
							toggle: toggle( 'stt_enabled' ),
						},
						el( Row, { key: 'icon', label: __( 'Arrow', 'willow-scroll' ) }, el( IconPicker, { value: values.stt_icon_style, onChange: set } ) ),
						colorRow( [ 'stt_bg_color', 'stt_icon_color' ], __( 'Colors', 'willow-scroll' ) ),
						row( 'stt_icon_size', { help: __( 'Size of the arrow itself.', 'willow-scroll' ) } ),
						row( 'stt_padding', { help: __( 'Together with the arrow size this sets the size of the button.', 'willow-scroll' ) } ),
						row( 'stt_radius_px', { help: sprintf( __( '0 is a square. %d px or more makes a circle.', 'willow-scroll' ), Math.ceil( ( values.stt_icon_size + 2 * values.stt_padding ) / 2 ) ) } ),
						segRow( 'stt_hover', __( 'Hover effect', 'willow-scroll' ), __( 'Also shown when the button is focused with the keyboard.', 'willow-scroll' ), [
							{ value: 'none', label: __( 'None', 'willow-scroll' ) },
							{ value: 'lift', label: __( 'Lift', 'willow-scroll' ) },
							{ value: 'grow', label: __( 'Grow', 'willow-scroll' ) },
						] ),
						colorRow( [ 'stt_bg_hover_color', 'stt_icon_hover_color' ], __( 'Colors on hover', 'willow-scroll' ) ),
						segRow( 'stt_position', __( 'Side', 'willow-scroll' ), null, [
							{ value: 'left', label: __( 'Left', 'willow-scroll' ) },
							{ value: 'right', label: __( 'Right', 'willow-scroll' ) },
						] ),
						row( 'stt_inset_x', { help: __( 'From the left or right edge of the screen.', 'willow-scroll' ) } ),
						row( 'stt_inset_y', { help: __( 'From the bottom of the screen.', 'willow-scroll' ) } ),
						row( 'stt_offset', { help: __( 'How far the visitor scrolls before the button appears.', 'willow-scroll' ) } )
					),
					el(
						Section,
						{ key: 'csb', title: __( 'Scrollbar', 'willow-scroll' ), description: __( 'Custom colors and width for the page scrollbar.', 'willow-scroll' ), toggle: toggle( 'csb_enabled' ) },
						colorRow( [ 'csb_track_color', 'csb_thumb_color', 'csb_thumb_hover_color', values.csb_thumb_border > 0 && 'csb_thumb_border_color' ], __( 'Colors', 'willow-scroll' ) ),
						row( 'csb_width' ),
						row( 'csb_border_radius' ),
						row( 'csb_thumb_border' ),
						row( 'csb_skip_mobile', { label: __( 'Native on small screens', 'willow-scroll' ), help: __( 'Keeps the system scrollbar below the breakpoint.', 'willow-scroll' ) } )
					),
				];
			},
		};

		return el(
			'div',
			{ className: 'ws-app' },
			el(
				'div',
				{ className: 'ws-topbar' },
				el( 'p', { className: 'ws-topbar__title' }, el( Mark ), __( 'Willow Scroll', 'willow-scroll' ), el( 'span', null, page.version ) ),
				el(
					'div',
					{ className: 'ws-topbar__actions' },
					el( 'span', { className: 'ws-status' + ( dirty ? ' is-on' : '' ), role: 'status' }, dirty ? __( 'Unsaved changes', 'willow-scroll' ) : '' ),
					el( C.Button, { variant: 'tertiary', href: page.homeUrl, target: '_blank' }, __( 'View site', 'willow-scroll' ) ),
					el( C.Button, { variant: 'primary', onClick: save, isBusy: busyV[ 0 ], disabled: ! dirty || busyV[ 0 ] }, __( 'Save changes', 'willow-scroll' ) )
				)
			),
			el(
				'div',
				{ className: 'ws-layout' },
				el(
					C.NavigableMenu,
					{ className: 'ws-nav', orientation: 'vertical', role: 'tablist', 'aria-label': __( 'Settings sections', 'willow-scroll' ) },
					NAV.map( function ( n ) {
						var active = n.name === tab;
						return el(
							C.Button,
							{
								key: n.name,
								className: 'ws-nav__item' + ( active ? ' is-active' : '' ),
								role: 'tab',
								'aria-selected': active,
								'aria-controls': 'ws-panel',
								onClick: function () {
									tabV[ 1 ]( n.name );
									window.scrollTo( 0, 0 );
								},
							},
							ICONS[ n.name ],
							el( 'span', { className: 'ws-nav__text' }, el( 'span', { className: 'ws-nav__title' }, n.title ), el( 'span', { className: 'ws-nav__meta' }, n.meta ) )
						);
					} )
				),
				el( 'main', { id: 'ws-panel', className: 'ws-main', role: 'tabpanel' }, panels[ tab ] ? panels[ tab ]() : null )
			),
			el( Notices )
		);
	}

	function mount() {
		var node = document.getElementById( 'willow-scroll-settings' );
		if ( node ) {
			// Popovers render inside the same wrapper, so they inherit the accent variables.
			wp.element.createRoot( node ).render( el( 'div', { className: 'ws-root' }, el( C.SlotFillProvider, null, el( App ), el( C.Popover.Slot ) ) ) );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mount );
	} else {
		mount();
	}
} )( window.wp );
