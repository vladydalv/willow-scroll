/**
 * Willow Scroll — per-page fields in the Classic Editor meta box
 * (and for post types without custom-fields support in the block editor).
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var useState = wp.element.useState;
	var PageFields = window.willowScrollControls.PageFields;

	function MetaBox( props ) {
		var state = useState( props.initial );
		return el( PageFields, {
			value: state[ 0 ],
			label: wp.i18n.__( 'Overrides for this page', 'willow-scroll' ),
			placement: 'left-start',
			onChange: function ( next ) {
				state[ 1 ]( next );
				props.input.value = JSON.stringify( next );
			},
		} );
	}

	function mount() {
		var node = document.getElementById( 'willow-scroll-page-root' );
		var input = document.getElementById( 'willow-scroll-page-input' );
		if ( ! node || ! input || node.dataset.mounted ) {
			return;
		}
		node.dataset.mounted = '1';
		var initial = {};
		try {
			initial = JSON.parse( input.value ) || {};
		} catch ( e ) {}
		var box = el( MetaBox, { initial: initial, input: input } );
		// The block editor already provides a popover slot; Classic Editor does not.
		var tree = document.body.classList.contains( 'block-editor-page' )
			? box
			: el( wp.components.SlotFillProvider, null, box, el( wp.components.Popover.Slot ) );
		wp.element.createRoot( node ).render( tree );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', mount );
	} else {
		mount();
	}
} )( window.wp );
