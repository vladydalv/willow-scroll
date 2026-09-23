<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'willow_scroll_settings' );
delete_option( 'willow_scroll_db_version' );
delete_option( 'willow_scroll_templates' );
delete_option( 'willow_scroll_meta_pending' );
delete_option( 'willow_scroll_detected' );

// Per-page settings, including keys left by earlier development versions.
foreach ( array( '_willow_scroll_page', '_willow_scroll_disabled', '_willow_scroll_override', '_willow_scroll_page_options' ) as $willow_scroll_key ) {
	delete_post_meta_by_key( $willow_scroll_key );
}
