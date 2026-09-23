/**
 * Willow Scroll — shared admin controls.
 * Native @wordpress/components only, no build step.
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var sprintf = wp.i18n.sprintf;
	var C = wp.components;
	var data = window.willowScrollData || { schema: {}, global: {}, palette: [] };

	var LABELS = {
		selector: __( 'Header selector', 'willow-scroll' ),
		header_mode: __( 'Header', 'willow-scroll' ),
		sticky: __( 'Sticky', 'willow-scroll' ),
		scroll_behavior: __( 'On scroll', 'willow-scroll' ),
		hide_after: __( 'Start hiding after', 'willow-scroll' ),
		scroll_tolerance: __( 'Scroll tolerance', 'willow-scroll' ),
		scrolled_offset: __( 'Scrolled state after', 'willow-scroll' ),
		disable_on_mobile: __( 'Keep the theme header on small screens', 'willow-scroll' ),
		mobile_breakpoint: __( 'Small screen breakpoint', 'willow-scroll' ),
		z_index: __( 'Stacking order (z-index)', 'willow-scroll' ),
		transition_duration: __( 'Duration', 'willow-scroll' ),
		transition_easing: __( 'Easing', 'willow-scroll' ),
		regular_bg: __( 'Background', 'willow-scroll' ),
		scrolled_bg_enabled: __( 'Sticky header background', 'willow-scroll' ),
		scrolled_bg: __( 'Background', 'willow-scroll' ),
		blur: __( 'Blur', 'willow-scroll' ),
		shadow_enabled: __( 'Shadow', 'willow-scroll' ),
		shadow_color: __( 'Shadow color', 'willow-scroll' ),
		shadow_y: __( 'Shadow offset', 'willow-scroll' ),
		shadow_blur: __( 'Shadow softness', 'willow-scroll' ),
		background_selector: __( 'Background element', 'willow-scroll' ),
		shrink_enabled: __( 'Shrink on scroll', 'willow-scroll' ),
		shrink_height: __( 'Height when sticky', 'willow-scroll' ),
		line_enabled: __( 'Bottom line', 'willow-scroll' ),
		line_color: __( 'Line color', 'willow-scroll' ),
		line_width: __( 'Line width', 'willow-scroll' ),
		float_enabled: __( 'Floating', 'willow-scroll' ),
		float_inset_x: __( 'Distance from the sides', 'willow-scroll' ),
		float_inset_y: __( 'Distance from the top', 'willow-scroll' ),
		float_radius: __( 'Corner radius', 'willow-scroll' ),
		float_corners: __( 'Different corners', 'willow-scroll' ),
		float_radius_tl: __( 'Top left', 'willow-scroll' ),
		float_radius_tr: __( 'Top right', 'willow-scroll' ),
		float_radius_br: __( 'Bottom right', 'willow-scroll' ),
		float_radius_bl: __( 'Bottom left', 'willow-scroll' ),
		progress_bar: __( 'Reading progress bar', 'willow-scroll' ),
		progress_bar_color: __( 'Color', 'willow-scroll' ),
		progress_bar_height: __( 'Height', 'willow-scroll' ),
		progress_bar_position: __( 'Position', 'willow-scroll' ),
		stt_enabled: __( 'Scroll-to-top button', 'willow-scroll' ),
		stt_offset: __( 'Show after', 'willow-scroll' ),
		stt_bg_color: __( 'Background', 'willow-scroll' ),
		stt_icon_color: __( 'Arrow', 'willow-scroll' ),
		stt_icon_size: __( 'Arrow size', 'willow-scroll' ),
		stt_padding: __( 'Space around the arrow', 'willow-scroll' ),
		stt_radius_px: __( 'Corner radius', 'willow-scroll' ),
		stt_hover: __( 'Hover effect', 'willow-scroll' ),
		stt_bg_hover_color: __( 'Background', 'willow-scroll' ),
		stt_icon_hover_color: __( 'Arrow', 'willow-scroll' ),
		stt_icon_style: __( 'Icon', 'willow-scroll' ),
		stt_position: __( 'Side', 'willow-scroll' ),
		stt_inset_x: __( 'Distance from side', 'willow-scroll' ),
		stt_inset_y: __( 'Distance from bottom', 'willow-scroll' ),
		csb_enabled: __( 'Custom scrollbar', 'willow-scroll' ),
		csb_width: __( 'Width', 'willow-scroll' ),
		csb_track_color: __( 'Track', 'willow-scroll' ),
		csb_thumb_color: __( 'Thumb', 'willow-scroll' ),
		csb_thumb_hover_color: __( 'Thumb on hover', 'willow-scroll' ),
		csb_border_radius: __( 'Thumb roundness', 'willow-scroll' ),
		csb_thumb_border: __( 'Thumb border', 'willow-scroll' ),
		csb_thumb_border_color: __( 'Thumb border color', 'willow-scroll' ),
		csb_skip_mobile: __( 'Keep the native scrollbar on small screens', 'willow-scroll' ),
		logo_regular_id: __( 'Regular header', 'willow-scroll' ),
		logo_transparent_id: __( 'Transparent header', 'willow-scroll' ),
		logo_sticky_id: __( 'Sticky header', 'willow-scroll' ),
		logo_resize: __( 'Resize logo on scroll', 'willow-scroll' ),
		logo_height_default: __( 'Max height at the top', 'willow-scroll' ),
		logo_height_scrolled: __( 'Max height when scrolled', 'willow-scroll' ),
	};

	var ENUMS = {
		header_mode: {
			flow: __( 'Regular', 'willow-scroll' ),
			overlay: __( 'Transparent', 'willow-scroll' ),
		},
		scroll_behavior: {
			smart: __( 'Hide going down, show going up', 'willow-scroll' ),
			always: __( 'Always visible', 'willow-scroll' ),
			hide: __( 'Hide going down, show near the top', 'willow-scroll' ),
		},
		transition_easing: {
			ease: __( 'Ease', 'willow-scroll' ),
			'ease-in-out': __( 'Ease in-out', 'willow-scroll' ),
			'ease-in': __( 'Ease in', 'willow-scroll' ),
			'ease-out': __( 'Ease out', 'willow-scroll' ),
			linear: __( 'Linear', 'willow-scroll' ),
		},
		progress_bar_position: {
			top: __( 'Top of the screen', 'willow-scroll' ),
			bottom: __( 'Bottom of the screen', 'willow-scroll' ),
		},
		stt_icon_style: {
			chevron: __( 'Chevron', 'willow-scroll' ),
			'double-chevron': __( 'Double chevron', 'willow-scroll' ),
			arrow: __( 'Arrow', 'willow-scroll' ),
			'long-arrow': __( 'Long arrow', 'willow-scroll' ),
			'arrow-bar': __( 'To top', 'willow-scroll' ),
			caret: __( 'Triangle', 'willow-scroll' ),
		},
		stt_hover: {
			none: __( 'None', 'willow-scroll' ),
			lift: __( 'Lift', 'willow-scroll' ),
			grow: __( 'Grow', 'willow-scroll' ),
		},
		stt_position: {
			right: __( 'Right', 'willow-scroll' ),
			left: __( 'Left', 'willow-scroll' ),
		},
	};

	var UNITS = {
		hide_after: 'px', scroll_tolerance: 'px', scrolled_offset: 'px', mobile_breakpoint: 'px',
		transition_duration: 'ms', blur: 'px', shadow_y: 'px', shadow_blur: 'px',
		shrink_height: 'px', line_width: 'px', float_inset_x: 'px', float_inset_y: 'px', float_radius: 'px',
		float_radius_tl: 'px', float_radius_tr: 'px', float_radius_br: 'px', float_radius_bl: 'px', progress_bar_height: 'px',
		stt_offset: 'px', stt_icon_size: 'px', stt_padding: 'px', stt_radius_px: 'px',
		stt_inset_x: 'px', stt_inset_y: 'px', csb_width: 'px', csb_border_radius: 'px',
		csb_thumb_border: 'px', logo_height_default: 'px', logo_height_scrolled: 'px',
	};

	var ToggleGroup = C.ToggleGroupControl || C.__experimentalToggleGroupControl;
	var ToggleGroupOption = C.ToggleGroupControlOption || C.__experimentalToggleGroupControlOption;

	/**
	 * One color row: swatch + label, opens ColorPalette (theme palette, alpha) with reset.
	 */
	function ColorField( props ) {
		var value = props.value || '';
		var isDefault = value === props.defaultValue;

		return el( C.Dropdown, {
			className: 'willow-color-field',
			contentClassName: 'willow-color-field__popover',
			popoverProps: { placement: props.placement || 'bottom-start', offset: props.placement === 'left-start' ? 36 : 8, shift: true },
			renderToggle: function ( t ) {
				return el(
					C.Button,
					{
						className: 'willow-color-field__toggle' + ( t.isOpen ? ' is-open' : '' ),
						onClick: t.onToggle,
						'aria-expanded': t.isOpen,
						disabled: props.disabled,
					},
					el( C.ColorIndicator, { colorValue: value } ),
					el( 'span', { className: 'willow-color-field__label' }, props.label )
				);
			},
			renderContent: function () {
				return el(
					'div',
					{ className: 'willow-color-field__content' },
					el( C.ColorPalette, {
						colors: data.palette,
						value: value,
						enableAlpha: true,
						clearable: false,
						onChange: function ( next ) {
							props.onChange( next === undefined ? props.defaultValue : next );
						},
					} ),
					! isDefault &&
						el(
							C.Button,
							{
								variant: 'tertiary',
								size: 'small',
								onClick: function () {
									props.onChange( props.defaultValue );
								},
							},
							__( 'Reset', 'willow-scroll' )
						)
				);
			},
		} );
	}

	/**
	 * Several colors in one bordered list, like the core Color panel.
	 * props: names[], values, onChange(name, value), fallbacks{}, labels{}, label, placement
	 */
	function ColorGroup( props ) {
		var names = props.names.filter( Boolean );
		if ( ! names.length ) {
			return null;
		}
		return el(
			'div',
			{ className: 'willow-color-group' },
			props.label && el( 'p', { className: 'willow-color-group__label' }, props.label ),
			el(
				'div',
				{ className: 'willow-color-group__list' },
				names.map( function ( name ) {
					var def = data.schema[ name ] || {};
					return el( ColorField, {
						key: name,
						label: ( props.labels && props.labels[ name ] ) || LABELS[ name ] || name,
						value: props.values[ name ],
						defaultValue: props.fallbacks && props.fallbacks[ name ] !== undefined ? props.fallbacks[ name ] : def.default,
						placement: props.placement,
						onChange: function ( v ) {
							props.onChange( name, v );
						},
					} );
				} )
			)
		);
	}

	function isGradient( v ) {
		return typeof v === 'string' && v.indexOf( 'gradient(' ) > -1;
	}

	/**
	 * Background: a color or a gradient from the theme, like the core Background control.
	 * props: label, value, defaultValue, allowNone, placement, onChange(value)
	 * '' means no background.
	 */
	function BackgroundField( props ) {
		var value = props.value || '';
		var name = ! value ? __( 'None', 'willow-scroll' ) : isGradient( value ) ? __( 'Gradient', 'willow-scroll' ) : value;

		return el(
			'div',
			{ className: 'willow-color-group' },
			el(
				'div',
				{ className: 'willow-color-group__list' },
				el( C.Dropdown, {
					className: 'willow-color-field',
					contentClassName: 'willow-color-field__popover',
					popoverProps: { placement: props.placement || 'bottom-end', offset: props.placement === 'left-start' ? 36 : 8, shift: true },
					renderToggle: function ( t ) {
						return el(
							C.Button,
							{
								className: 'willow-color-field__toggle' + ( t.isOpen ? ' is-open' : '' ),
								onClick: t.onToggle,
								'aria-expanded': t.isOpen,
								'aria-label': ( props.label || LABELS.scrolled_bg ) + ': ' + name,
							},
							el( C.ColorIndicator, { colorValue: value || 'transparent' } ),
							el( 'span', { className: 'willow-color-field__label' }, name )
						);
					},
					renderContent: function () {
						return el(
							'div',
							{ className: 'willow-color-field__content is-background' },
							el(
								C.TabPanel,
								{
									className: 'willow-bg-tabs',
									initialTabName: isGradient( value ) ? 'gradient' : 'color',
									tabs: [
										{ name: 'color', title: __( 'Color', 'willow-scroll' ) },
										{ name: 'gradient', title: __( 'Gradient', 'willow-scroll' ) },
									],
								},
								function ( tab ) {
									if ( tab.name === 'gradient' ) {
										return el( C.GradientPicker, {
											value: isGradient( value ) ? value : null,
											gradients: data.gradients || [],
											clearable: false,
											onChange: function ( g ) {
												props.onChange( g || '' );
											},
										} );
									}
									return el( C.ColorPalette, {
										colors: data.palette,
										value: isGradient( value ) ? undefined : value,
										enableAlpha: true,
										clearable: false,
										onChange: function ( c ) {
											props.onChange( c || '' );
										},
									} );
								}
							),
							el(
								'div',
								{ className: 'willow-bg-actions' },
								props.allowNone &&
									value &&
									el(
										C.Button,
										{
											variant: 'tertiary',
											size: 'small',
											onClick: function () {
												props.onChange( '' );
											},
										},
										__( 'Clear', 'willow-scroll' )
									),
								props.defaultValue !== undefined &&
									value !== props.defaultValue &&
									el(
										C.Button,
										{
											variant: 'tertiary',
											size: 'small',
											onClick: function () {
												props.onChange( props.defaultValue );
											},
										},
										__( 'Reset', 'willow-scroll' )
									)
							)
						);
					},
				} )
			)
		);
	}

	/**
	 * Logo image. 0 keeps the site logo.
	 * props: value (attachment id), onChange(id)
	 */
	function LogoField( props ) {
		var MediaUpload = wp.mediaUtils && wp.mediaUtils.MediaUpload;
		var media = wp.data.useSelect(
			function ( select ) {
				return props.value ? select( 'core' ).getMedia( props.value ) : null;
			},
			[ props.value ]
		);
		var preview = media && ( ( media.media_details && media.media_details.sizes && media.media_details.sizes.medium && media.media_details.sizes.medium.source_url ) || media.source_url );

		if ( ! MediaUpload ) {
			return null;
		}
		return el( MediaUpload, {
			allowedTypes: [ 'image' ],
			value: props.value,
			onSelect: function ( m ) {
				props.onChange( m.id );
			},
			render: function ( o ) {
				return el(
					'div',
					{ className: 'willow-logo-field' },
					el(
						'button',
						{ type: 'button', className: 'willow-logo-field__thumb' + ( props.value ? '' : ' is-empty' ), onClick: o.open, 'aria-label': props.value ? __( 'Replace logo', 'willow-scroll' ) : __( 'Choose logo', 'willow-scroll' ) },
						preview ? el( 'img', { src: preview, alt: '' } ) : el( 'span', null, props.value ? '' : __( 'Site logo', 'willow-scroll' ) )
					),
					el(
						'div',
						{ className: 'willow-logo-field__actions' },
						el( C.Button, { variant: 'secondary', size: 'compact', onClick: o.open }, props.value ? __( 'Replace', 'willow-scroll' ) : __( 'Choose', 'willow-scroll' ) ),
						props.onReset
							? el( C.Button, { variant: 'tertiary', size: 'compact', onClick: props.onReset }, __( 'Use default', 'willow-scroll' ) )
							: props.value > 0 &&
									el(
										C.Button,
										{
											variant: 'tertiary',
											size: 'compact',
											onClick: function () {
												props.onChange( 0 );
											},
										},
										__( 'Use site logo', 'willow-scroll' )
									)
					)
				);
			},
		} );
	}

	/**
	 * Renders the right native control for a schema key.
	 * props: name, value, onChange(name, value), label, help, placeholder, disabled, fallback, placement
	 */
	function SettingControl( props ) {
		var def = data.schema[ props.name ];
		if ( ! def ) {
			return null;
		}
		var label = props.label || LABELS[ props.name ] || props.name;
		var fallback = props.fallback !== undefined ? props.fallback : def.default;
		var change = function ( v ) {
			props.onChange( props.name, v );
		};

		switch ( def.type ) {
			case 'bool':
				return el( C.ToggleControl, {
					label: label,
					help: props.help,
					checked: !! props.value,
					disabled: props.disabled,
					onChange: change,
					__nextHasNoMarginBottom: true,
				} );

			case 'int':
				var unit = UNITS[ props.name ];
				return el( C.RangeControl, {
					label: unit ? label + ' (' + unit + ')' : label,
					hideLabelFromVision: !! props.hideLabel,
					help: props.help,
					value: props.value,
					min: def.min,
					max: def.max,
					disabled: props.disabled,
					allowReset: true,
					resetFallbackValue: fallback,
					onChange: function ( v ) {
						change( v === undefined || v === null || isNaN( v ) ? fallback : v );
					},
					__nextHasNoMarginBottom: true,
					__next40pxDefaultSize: true,
				} );

			case 'enum':
				var labels = ENUMS[ props.name ] || {};
				return el( C.SelectControl, {
					label: label,
					hideLabelFromVision: !! props.hideLabel,
					help: props.help,
					value: props.value,
					disabled: props.disabled,
					options: def.enum.map( function ( v ) {
						return { value: v, label: labels[ v ] || v };
					} ),
					onChange: change,
					__nextHasNoMarginBottom: true,
					__next40pxDefaultSize: true,
				} );

			case 'selector':
				return el( C.TextControl, {
					label: label,
					hideLabelFromVision: !! props.hideLabel,
					help: props.help,
					value: props.value || '',
					placeholder: props.placeholder,
					disabled: props.disabled,
					onChange: change,
					spellCheck: false,
					__nextHasNoMarginBottom: true,
					__next40pxDefaultSize: true,
				} );

			case 'background':
				return el( BackgroundField, {
					label: label,
					value: props.value,
					defaultValue: fallback,
					allowNone: true,
					placement: props.placement,
					onChange: change,
				} );

			case 'color':
				var values = {};
				var fallbacks = {};
				var labelMap = {};
				values[ props.name ] = props.value;
				fallbacks[ props.name ] = fallback;
				labelMap[ props.name ] = label;
				return el( ColorGroup, {
					names: [ props.name ],
					values: values,
					fallbacks: fallbacks,
					labels: labelMap,
					placement: props.placement,
					onChange: props.onChange,
				} );
		}
		return null;
	}

	/**
	 * Position as a two-option segmented control (falls back to a select).
	 */
	function ModeControl( props ) {
		if ( ! ToggleGroup || ! ToggleGroupOption ) {
			return el( SettingControl, { name: 'header_mode', value: props.value, help: props.help, onChange: props.onChange } );
		}
		return el(
			ToggleGroup,
			{
				label: LABELS.header_mode,
				help: props.help,
				value: props.value,
				isBlock: true,
				onChange: function ( v ) {
					props.onChange( 'header_mode', v );
				},
				__nextHasNoMarginBottom: true,
				__next40pxDefaultSize: true,
			},
			el( ToggleGroupOption, { value: 'flow', label: __( 'Regular', 'willow-scroll' ) } ),
			el( ToggleGroupOption, { value: 'overlay', label: __( 'Transparent', 'willow-scroll' ) } )
		);
	}

	/**
	 * Header type and look for a page or a template.
	 * A key that is not set inherits: page ← template ← site settings.
	 * props: value, onChange(next), inherited { values, sources, template }, placement,
	 *        toggle (default true): an "Override header settings" switch that hides the fields while off.
	 */
	var OVERRIDE_KEYS = [ 'header_mode', 'sticky', 'regular_bg', 'logo_regular_id', 'logo_transparent_id', 'scrolled_bg', 'logo_sticky_id' ];

	function OverrideFields( props ) {
		var value = props.value || {};
		var inherited = props.inherited || window.willowScrollInherited || { values: data.global, sources: {}, template: '' };
		var base = inherited.values || data.global;

		function has( k ) {
			return value[ k ] !== undefined && value[ k ] !== null;
		}
		function get( k ) {
			return has( k ) ? value[ k ] : base[ k ];
		}
		var withToggle = props.toggle !== false;

		function set( k, v ) {
			var next = {};
			OVERRIDE_KEYS.forEach( function ( key ) {
				if ( has( key ) ) {
					next[ key ] = value[ key ];
				}
			} );
			if ( v === undefined ) {
				delete next[ k ];
			} else {
				next[ k ] = v;
			}
			next.override = withToggle ? !! value.override : true;
			props.onChange( next );
		}
		function setOverride( on ) {
			var next = Object.assign( {}, value );
			next.override = on;
			props.onChange( next );
		}
		function from( k ) {
			return inherited.sources && inherited.sources[ k ] === 'template'
				? sprintf( __( 'template %s', 'willow-scroll' ), inherited.template )
				: __( 'site settings', 'willow-scroll' );
		}
		function hint( k, text ) {
			/* translators: 1: inherited value, 2: where it comes from */
			return sprintf( __( 'Default: %1$s, from %2$s.', 'willow-scroll' ), text, from( k ) );
		}
		function bgName( v, k ) {
			if ( ! v ) {
				return k === 'regular_bg' ? __( 'theme background', 'willow-scroll' ) : __( 'none', 'willow-scroll' );
			}
			return isGradient( v ) ? __( 'gradient', 'willow-scroll' ) : v;
		}

		// Default / Yes / No for a two-valued setting.
		function tri( k, label, yes, no ) {
			var current = has( k ) ? ( value[ k ] === yes ? 'yes' : 'no' ) : 'default';
			var control = ToggleGroup
				? el(
						ToggleGroup,
						{
							label: label,
							value: current,
							isBlock: true,
							help: hint( k, base[ k ] === yes ? __( 'yes', 'willow-scroll' ) : __( 'no', 'willow-scroll' ) ),
							onChange: function ( v ) {
								set( k, v === 'default' ? undefined : v === 'yes' ? yes : no );
							},
							__nextHasNoMarginBottom: true,
							__next40pxDefaultSize: true,
						},
						el( ToggleGroupOption, { value: 'default', label: __( 'Default', 'willow-scroll' ) } ),
						el( ToggleGroupOption, { value: 'yes', label: __( 'Yes', 'willow-scroll' ) } ),
						el( ToggleGroupOption, { value: 'no', label: __( 'No', 'willow-scroll' ) } )
				  )
				: el( C.SelectControl, {
						label: label,
						value: current,
						help: hint( k, base[ k ] === yes ? __( 'yes', 'willow-scroll' ) : __( 'no', 'willow-scroll' ) ),
						options: [
							{ value: 'default', label: __( 'Default', 'willow-scroll' ) },
							{ value: 'yes', label: __( 'Yes', 'willow-scroll' ) },
							{ value: 'no', label: __( 'No', 'willow-scroll' ) },
						],
						onChange: function ( v ) {
							set( k, v === 'default' ? undefined : v === 'yes' ? yes : no );
						},
						__nextHasNoMarginBottom: true,
						__next40pxDefaultSize: true,
				  } );
			return el( 'div', { key: k }, control );
		}

		function background( k ) {
			return el(
				C.BaseControl,
				{ key: k, label: __( 'Background', 'willow-scroll' ), id: 'willow-o-' + k, help: has( k ) ? null : hint( k, bgName( base[ k ], k ) ), __nextHasNoMarginBottom: true },
				el( BackgroundField, {
					label: __( 'Background', 'willow-scroll' ),
					value: get( k ),
					allowNone: true,
					placement: props.placement,
					onChange: function ( v ) {
						set( k, v );
					},
				} ),
				has( k ) &&
					el(
						C.Button,
						{
							variant: 'link',
							className: 'willow-override__reset',
							onClick: function () {
								set( k, undefined );
							},
						},
						__( 'Use default', 'willow-scroll' )
					)
			);
		}

		function logo( k ) {
			return el(
				C.BaseControl,
				{ key: k, label: __( 'Logo', 'willow-scroll' ), id: 'willow-o-' + k, help: has( k ) ? null : hint( k, base[ k ] ? __( 'custom logo', 'willow-scroll' ) : __( 'site logo', 'willow-scroll' ) ), __nextHasNoMarginBottom: true },
				el( LogoField, {
					value: get( k ),
					onChange: function ( id ) {
						set( k, id );
					},
					onReset: has( k )
						? function () {
								set( k, undefined );
						  }
						: null,
				} )
			);
		}

		var transparent = get( 'header_mode' ) === 'overlay';
		var sticky = !! get( 'sticky' );

		var switchControl =
			withToggle &&
			el( C.ToggleControl, {
				label: __( 'Override header settings', 'willow-scroll' ),
				help: value.override
					? null
					: inherited.template
					? sprintf( __( 'Follows the template %s.', 'willow-scroll' ), inherited.template )
					: __( 'Follows the site settings.', 'willow-scroll' ),
				checked: !! value.override,
				onChange: setOverride,
				__nextHasNoMarginBottom: true,
			} );

		if ( withToggle && ! value.override ) {
			return el( 'div', { className: 'willow-override' }, switchControl );
		}

		return el(
			'div',
			{ className: 'willow-override' },
			switchControl,
			tri( 'header_mode', __( 'Transparent', 'willow-scroll' ), 'overlay', 'flow' ),
			tri( 'sticky', __( 'Sticky', 'willow-scroll' ), true, false ),
			! transparent &&
				el( 'div', { className: 'willow-override__group' }, el( 'p', { className: 'willow-override__title' }, __( 'Regular header', 'willow-scroll' ) ), background( 'regular_bg' ), logo( 'logo_regular_id' ) ),
			transparent &&
				el( 'div', { className: 'willow-override__group' }, el( 'p', { className: 'willow-override__title' }, __( 'Transparent header', 'willow-scroll' ) ), logo( 'logo_transparent_id' ) ),
			sticky &&
				el( 'div', { className: 'willow-override__group' }, el( 'p', { className: 'willow-override__title' }, __( 'Sticky header', 'willow-scroll' ) ), background( 'scrolled_bg' ), logo( 'logo_sticky_id' ) ),
			! transparent && ! sticky && el( 'p', { className: 'willow-override__note' }, __( 'The header scrolls away with the page. Without its own background or logo it stays exactly as in the theme.', 'willow-scroll' ) )
		);
	}

	window.willowScrollControls = {
		data: data,
		labels: LABELS,
		ColorField: ColorField,
		ColorGroup: ColorGroup,
		ModeControl: ModeControl,
		BackgroundField: BackgroundField,
		LogoField: LogoField,
		units: UNITS,
		enums: ENUMS,
		SettingControl: SettingControl,
		OverrideFields: OverrideFields,
		PageFields: OverrideFields,
	};
} )( window.wp );
