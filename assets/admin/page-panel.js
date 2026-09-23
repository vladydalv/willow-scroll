/**
 * Willow Scroll — per-page panel in the block editor document sidebar.
 */
( function ( wp ) {
	'use strict';

	var el = wp.element.createElement;
	var __ = wp.i18n.__;
	var useSelect = wp.data.useSelect;
	var useDispatch = wp.data.useDispatch;
	var Panel = wp.editor.PluginDocumentSettingPanel;
	var PageFields = window.willowScrollControls.PageFields;
	var KEY = '_willow_scroll_page';

	function WillowScrollPanel() {
		var meta = useSelect( function ( select ) {
			return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
		}, [] );
		var editPost = useDispatch( 'core/editor' ).editPost;

		// No `meta` in REST (post type without custom-fields): the meta box handles it.
		if ( ! meta || ! Object.prototype.hasOwnProperty.call( meta, KEY ) ) {
			return null;
		}

		return el(
			Panel,
			{ name: 'willow-scroll', title: __( 'Header scroll', 'willow-scroll' ), className: 'willow-scroll-panel' },
			el( PageFields, {
				value: meta[ KEY ],
				label: __( 'Overrides for this page', 'willow-scroll' ),
				placement: 'left-start',
				onChange: function ( next ) {
					var patch = {};
					patch[ KEY ] = next;
					editPost( { meta: patch } );
				},
			} )
		);
	}

	wp.plugins.registerPlugin( 'willow-scroll', { render: WillowScrollPanel, icon: null } );
} )( window.wp );
