<?php
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class My_Custom_Gateway extends WC_Payment_Gateway {

    public function __construct() {
        $this->id                 = 'my_custom_gateway';
        $this->method_title       = __('My Custom Gateway', 'my-custom-gateway');
        $this->method_description = __('Accept payments through My Custom Gateway.', 'my-custom-gateway');
        $this->has_fields         = true;

        // Supports array
        $this->supports = [
            'products',
            'refunds',
            'checkout-blocks', // Enable support for WooCommerce Checkout Blocks
        ];

        // Load settings
        $this->init_form_fields();
        $this->init_settings();

        // Get user-defined title
        $this->title = $this->get_option('title', __('My Custom Gateway', 'my-custom-gateway'));

        // Hook to save settings
        add_action('woocommerce_update_options_payment_gateways_' . $this->id, [$this, 'process_admin_options']);

        // Optionally register a payment method type for Blocks (if needed)
        add_filter('woocommerce_gateway_payment_method_type', [$this, 'register_block_type'], 10, 2);

        
    }

    public function register_block_type($type, $gateway_id) {
        if ($gateway_id === $this->id) {
            return 'custom'; // Or use 'card', 'redirect', etc.
        }
        return $type;
    }

    // Admin settings form fields
    public function init_form_fields() {
        $this->form_fields = [
            'enabled' => [
                'title'   => __('Enable/Disable', 'my-custom-gateway'),
                'type'    => 'checkbox',
                'label'   => __('Enable My Custom Gateway', 'my-custom-gateway'),
                'default' => 'yes',
            ],
            'title' => [
                'title'       => __('Title', 'my-custom-gateway'),
                'type'        => 'text',
                'description' => __('Title customers see during checkout.', 'my-custom-gateway'),
                'default'     => __('My Custom Gateway', 'my-custom-gateway'),
                'desc_tip'    => true,
            ],
        ];
    }

    // Checkout field UI
    public function payment_fields() {
        ?>
        <fieldset>
            <p class="form-row form-row-wide">
                <label for="custom_field"><?php esc_html_e('Custom Field', 'my-custom-gateway'); ?> <span class="required">*</span></label>
                <input type="text" class="input-text" name="custom_field" id="custom_field" required />
            </p>
        </fieldset>
        <?php
    }

    // Payment processing logic
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);

        // Optional: Set order origin
        if (! $order->get_meta('_wc_checkout_origin')) {
            $order->update_meta_data('_wc_checkout_origin', 'custom-gateway');
        }

        // Complete the payment
        $order->payment_complete();

        // Add custom note
        $order->add_order_note(__('Payment completed using My Custom Gateway.', 'my-custom-gateway'));

        // Reduce stock and empty cart
        wc_reduce_stock_levels($order_id);
        WC()->cart->empty_cart();

        // Save changes
        $order->save();

        // Return thank you redirect
        return [
            'result'   => 'success',
            'redirect' => $this->get_return_url($order),
        ];
    }


    /**
     * Add custom refund fields to the refund popup
     */
    public function add_custom_refund_fields($order_id) {
      
      
    ?>



    <div class="my-custom-gateway-refund-fields" style="padding: 10px; background: #f8f8f8; margin: 10px 0; border: 1px solid #ddd;">
                    <h4><?php esc_html_e('My Custom Gateway Refund', 'my-custom-gateway'); ?></h4>
                    <p>
                        <label>
                            <input type="checkbox" name="restock_refunded_items" checked="checked" />
                            <?php esc_html_e('Restock refunded items', 'my-custom-gateway'); ?>
                        </label>
                    </p>
                    <p>
                        <label>
                            <?php esc_html_e('Reason for refund (optional):', 'my-custom-gateway'); ?><br />
                            <textarea name="custom_gateway_refund_reason" style="width: 100%;"></textarea>
                        </label>
                    </p>
                </div>
      <style>

        .button.refund-items {display:none}
      </style>
   

    

    <?php
      
    }
}

// Add custom refund fields to refund popup
add_action('woocommerce_order_item_add_action_buttons', 'add_my_custom_gateway_refund_fields');
function add_my_custom_gateway_refund_fields($order) {
    $gateway = new My_Custom_Gateway();
    $gateway->add_custom_refund_fields($order->get_id());
}
?>
