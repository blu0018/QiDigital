<?php
if (!defined('ABSPATH')) {
    exit;
}

class My_Custom_Gateway extends WC_Payment_Gateway {
    
    public function __construct() {
        $this->id = 'my_custom_gateway';
        $this->method_title = __('My Custom Gateway', 'my-custom-gateway');
        $this->method_description = __('Accept payments including Google Pay.', 'my-custom-gateway');
        $this->has_fields = true;
        
        $this->supports = [
            'products',
            'refunds',
            'checkout-blocks',
            'google_pay' // Our custom support flag
        ];
        
        $this->init_form_fields();
        $this->init_settings();
        
        $this->title = $this->get_option('title', __('My Custom Gateway', 'my-custom-gateway'));
        
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        // add_action('woocommerce_checkout_before_customer_details', [$this, 'display_google_pay_button'], 1);
        add_action('woocommerce_checkout_before_customer_details', [$this, 'display_apple_pay_button'], 1);

    }
    
    public function init_form_fields() {
        $this->form_fields = [
            'enabled' => [
                'title' => __('Enable/Disable', 'my-custom-gateway'),
                'type' => 'checkbox',
                'label' => __('Enable My Custom Gateway', 'my-custom-gateway'),
                'default' => 'yes',
            ],
            'title' => [
                'title' => __('Title', 'my-custom-gateway'),
                'type' => 'text',
                'default' => __('My Custom Gateway', 'my-custom-gateway'),
                'desc_tip' => true,
            ],
            'google_pay_merchant_id' => [
                'title' => __('Google Pay Merchant ID', 'my-custom-gateway'),
                'type' => 'text',
                'description' => __('Your Google Pay Merchant ID (from Google Pay Business Console)', 'my-custom-gateway'),
            ],
            'google_pay_merchant_name' => [
                'title' => __('Merchant Name', 'my-custom-gateway'),
                'type' => 'text',
                'default' => get_bloginfo('name'),
            ],
            'google_pay_environment' => [
                'title' => __('Environment', 'my-custom-gateway'),
                'type' => 'select',
                'options' => [
                    'TEST' => __('Test', 'my-custom-gateway'),
                    'PRODUCTION' => __('Production', 'my-custom-gateway'),
                ],
                'default' => 'TEST',
            ],
        ];
    }
    
    public function enqueue_scripts() {
        if (is_checkout() || is_product() || is_cart()) {
                // Load Google Pay JS library
                wp_enqueue_script(
                    'google-pay-js',
                    'https://pay.google.com/gp/p/js/pay.js',
                    [],
                    null,
                    true
                );
                
                // Load our custom handler
                wp_enqueue_script(
                    'my-custom-google-pay',
                    plugins_url('assets/js/my-custom-google-pay.js', __FILE__),
                    ['jquery', 'google-pay-js'],
                    WC_VERSION,
                    true
                );

    
                wp_localize_script('google-pay-handler', 'my_custom_google_pay_params', [
                    'merchant_id'   => $this->get_option('google_pay_merchant_id'),
                    'merchant_name' => $this->get_option('google_pay_merchant_name'),
                    'environment'   => $this->get_option('google_pay_environment', 'TEST'),
                    'currency'      => get_woocommerce_currency(),
                    'country'       => WC()->countries->get_base_country(),
                ]);


                wp_localize_script('my-gpay-script', 'my_custom_gateway_params', [
                    'nonce' => wp_create_nonce('gpay_token_nonce'),
                ]);


                wp_enqueue_script(
                    'my-custom-apple-pay',
                    plugins_url('assets/js/apple-pay.js', __FILE__),
                    ['jquery'], // Removed 'apple-pay-js' as it's not needed (Apple Pay uses native API)
                    filemtime(plugin_dir_path(__FILE__) . 'assets/js/apple-pay.js'), // Better version handling
                    true
                );
                
        }
    }
    
    public function display_google_pay_button() {
        ?>
        <div class="google_pay">
            <div id="google_pay_btn"></div>
        </div>
        
        
        <script async
        src="https://pay.google.com/gp/p/js/pay.js"
        onload="onGooglePayLoaded()"></script>
        <?php
    }
    

    public function payment_fields() {
    ?>
    <p><?php esc_html_e('Pay with Google Pay below.', 'my-custom-gateway'); ?></p>

    <div id="google_pay_btn" style="margin-top:10px;"></div>

    <?php
    }

    public function process_payment ($order_id) {
        var_dump($_POST);die;
    }

     public function display_apple_pay_button() {
        ?>
       <div id="apple-pay-button-container" style="margin: 15px 0; display: none;">
        <button id="apple-pay-button" style="-webkit-appearance: -apple-pay-button; -apple-pay-button-type: buy; -apple-pay-button-style: black; height: 40px; width: 100%;"></button>
        </div>
     
        <?php
    }
}

    add_action('wp_ajax_nopriv_my_custom_process_google_pay', 'handle_google_pay_token');
    add_action('wp_ajax_my_custom_process_google_pay', 'handle_google_pay_token');

    function handle_google_pay_token() {
        // Check nonce (uncomment and make sure it matches your JS)
        // check_ajax_referer('gpay_token_nonce', 'security');
        
        // Get and sanitize the raw POST data
        $raw_post = file_get_contents('php://input');
        $data = json_decode($raw_post, true);
        
        if (empty($data)) {
            wp_send_json_error('Invalid request data');
        }
        
        $token = isset($data['token']) ? sanitize_text_field(json_encode($data['token'])) : '';
        $order_id = isset($data['order_id']) ? absint($data['order_id']) : 0;

        if (empty($token)) {
            wp_send_json_error('Missing token');
        }

        // Process token (example)
        $response = [
            'status' => 'success',
            'message' => 'Token received',
            'token_received' => !empty($token)
        ];

        // Attach to order if needed
        if ($order_id > 0) {
            $order = wc_get_order($order_id);
            if ($order) {
                $order->add_order_note('Google Pay token received.');
                $order->update_meta_data('_gpay_token', $token);
                $order->save();
            }
        }

        wp_send_json_success($response);
    }

    function enqueue_google_pay_script() {
        wp_enqueue_script(
            'my-gpay-script',
            plugin_dir_url(__FILE__) . 'assets/js/checkout.js',
            ['wp-element', 'wp-i18n', 'wc-blocks-checkout'],
            '1.0',
            true
        );

        wp_localize_script('my-gpay-script', 'my_custom_gateway_params', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce'    => wp_create_nonce('gpay_token_nonce'),
        ]);
    }
    add_action('wp_enqueue_scripts', 'enqueue_google_pay_script');


    function add_saved_cards_endpoint() {
        add_rewrite_endpoint( 'saved-cards', EP_ROOT | EP_PAGES );
    }
    add_action( 'init', 'add_saved_cards_endpoint' );

    function add_saved_cards_link_my_account( $items ) {
        $items['saved-cards'] = 'Saved Cards';
        return $items;
    }
    add_filter( 'woocommerce_account_menu_items', 'add_saved_cards_link_my_account' );


    function saved_cards_content() {
        $user_id = get_current_user_id();
        $saved_cards = array(
            'card_123456789' => array(
                'card_id'     => 'card_123456789', // Unique identifier for the card
                'card_type'   => 'Visa', // Card brand (Visa, MasterCard, Amex, etc.)
                'last4'       => '4242', // Last 4 digits of card
                'exp_month'   => '12',   // 2-digit expiration month
                'exp_year'    => '2025', // 4-digit expiration year
                'fingerprint' => 'abc123xyz456', // Optional: Unique fingerprint from payment processor
                'gateway_id'  => 'stripe', // Optional: Which payment gateway saved this
                'is_default'  => true     // Optional: If this is the user's default card
            ),
            'card_987654321' => array(
                'card_id'     => 'card_987654321',
                'card_type'   => 'MasterCard',
                'last4'       => '5555',
                'exp_month'   => '03',
                'exp_year'    => '2026',
                'fingerprint' => 'def456uvw789',
                'gateway_id'  => 'stripe',
                'is_default'  => false
            ),
            'card_456789123' => array(
                'card_id'     => 'card_456789123',
                'card_type'   => 'American Express',
                'last4'       => '9999',
                'exp_month'   => '08',
                'exp_year'    => '2024',
                'fingerprint' => 'ghi789rst012',
                'gateway_id'  => 'authorize_net',
                'is_default'  => false
            )
        );
        
        if ( empty( $saved_cards ) ) {
            echo '<p>No saved cards found.</p>';
            return;
        }
    
        // Handle delete request
        if ( isset( $_GET['
        '] ) && wp_verify_nonce( $_GET['_wpnonce'], 'delete_card' ) ) {
            $card_id = sanitize_text_field( $_GET['delete_card'] );
            if ( isset( $saved_cards[$card_id] ) ) {
                unset( $saved_cards[$card_id] );
                update_user_meta( $user_id, '_saved_cards', $saved_cards );
                echo '<div class="woocommerce-message">Card deleted successfully.</div>';
            }
        }
    
        echo '<table class="woocommerce-orders-table woocommerce-MyAccount-orders shop_table shop_table_responsive my_account_orders account-orders-table">';
        echo '<thead><tr>';
        echo '<th>Card Type</th>';
        echo '<th>Last 4 Digits</th>';
        echo '<th>Expiry Date</th>';
        echo '<th>Actions</th>';
        echo '</tr></thead>';
        echo '<tbody>';
        
        foreach ( $saved_cards as $card_id => $card ) {
            echo '<tr>';
            echo '<td>' . esc_html( $card['card_type'] ) . '</td>';
            echo '<td>**** **** **** ' . esc_html( $card['last4'] ) . '</td>';
            echo '<td>' . esc_html( $card['exp_month'] ) . '/' . esc_html( $card['exp_year'] ) . '</td>';
            echo '<td>';
            echo '<a href="' . esc_url( wp_nonce_url( add_query_arg( 'delete_card', $card_id, wc_get_account_endpoint_url( 'saved-cards' ) ), 'delete_card' ) ) . '" class="woocommerce-button button delete">Delete</a>';
            echo '</td>';
            echo '</tr>';
        }
    
        echo '</tbody></table>';
    }
    add_action( 'woocommerce_account_saved-cards_endpoint', 'saved_cards_content' );

    function flush_rewrite_rules_once() {
        if ( get_option( 'saved_cards_endpoint_flushed' ) !== '1' ) {
            flush_rewrite_rules();
            update_option( 'saved_cards_endpoint_flushed', '1' );
        }
    }
    add_action( 'init', 'flush_rewrite_rules_once' );



add_action('woocommerce_proceed_to_checkout', 'my_custom_display_gpay_on_cart', 5);

function my_custom_display_gpay_on_cart() {
    ?>
    <div id="google_pay_cart_btn" style="margin-top:15px;">
        <div id="google_pay_btn" style="margin-top:10px;"></div>
    </div>
    <?php
}

add_action('wp_enqueue_scripts', 'enqueue_my_custom_cart_block_js');

function enqueue_my_custom_cart_block_js() {
    if (is_cart() || is_product()) {
        wp_enqueue_script(
            'my-gpay-cart-block',
            plugin_dir_url(__FILE__) . 'assets/js/cart-block.js',
            ['jquery'],
            time(), // for dev: avoids caching
            true
        );
    }
}

add_action('woocommerce_after_add_to_cart_button', 'my_custom_add_google_pay_on_product', 10);

function my_custom_add_google_pay_on_product() {
     ?>
    <p><?php esc_html_e('Pay with Google Pay below.', 'my-custom-gateway'); ?></p>

    <div id="google_pay_btn" style="margin-top:10px;"></div>

    <?php
}
