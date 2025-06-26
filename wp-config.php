<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'qidigital' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'for62Zrf!R(]zyYe_5%w:)gqV<[/nrH%#(Gqfe_/GYWjW-_l62d yiW[,i`NiK-t' );
define( 'SECURE_AUTH_KEY',  'sKYtMQ@#DMo &?[;|[%Ad1 U]67(zOA9]QhyWxRp#^sMYwpF4&,4>j/e`0i#ue$9' );
define( 'LOGGED_IN_KEY',    '{8%9cNnA&RdTvEyWc]<P7[}LSG?Jbr_zkZ#5PHoBu{?q?wA4jyInwLnZ{OS/i W0' );
define( 'NONCE_KEY',        '2KT%g{Jsjnk2jBnCbw=@*S)G[&p])Px!Gibc.AC#L^44qn2Fc^#T=;;6_{p(E{0N' );
define( 'AUTH_SALT',        '7rdl)_)`b$H8V~Iq+JGwo#V^k:vpIhdr$!}E5%cQ,=v_@!;Pm4%z`Q3 AMYu>YK(' );
define( 'SECURE_AUTH_SALT', ']jEj&b$Q#P9h-K]5LGF8)ATtYod-.98y2pZS0XfDc:SU)&gFQpz:lo;2w2r;RevY' );
define( 'LOGGED_IN_SALT',   'eNi4V;zlL%(A7&vL%9g%4my|^$+IiE[LNYA%8]O,7DXOLl{Nn~nAXmbqq`#u)(5z' );
define( 'NONCE_SALT',       'Vg`2]n~{Vdj;W.v;|>mJsfJ9Ah>Lj]e%Ex)w=AvI`g1gj-PIU/a0_3Z)0]8(QUs|' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */

/* Add any custom values between this line and the "stop editing" line. */

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

if ( ! defined( 'WP_DEBUG' ) ) {

   define( 'WP_DEBUG', true );

   define('WP_DEBUG_DISPLAY', false);

   define('WP_DEBUG_LOG', true);

}
/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';


