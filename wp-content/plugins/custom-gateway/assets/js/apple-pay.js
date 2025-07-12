jQuery(function($) {
    if (typeof ApplePaySession === 'undefined') {
        return;
    }

    var merchant_id = "Ddd";
    var country    = "US";
    var currency    = "USD";
    var merchant_name = "dert";

    // Check if Apple Pay is available
    if (!ApplePaySession.canMakePayments()) {
        return;
    }

    // Initialize Apple Pay button
    function initApplePay() {
        const $container = $('#apple-pay-button-container');
        
        if ($container.length === 0) {
            return;
        }

        // Show Apple Pay button if merchant ID is configured
        if (merchant_id) {
            $container.show();
            
            $('#apple-pay-button').on('click', function(e) {
                e.preventDefault();
                startApplePaySession();
            });
        }
    }

    // Start Apple Pay session
    function startApplePaySession() {
        const total = 3;
        const paymentRequest = {
            countryCode: country,
            currencyCode: currency,
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: ['amex', 'discover', 'masterCard', 'visa'],
            total: {
                label: merchant_name,
                amount: total.toString()
            }
        };

        const session = new ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = function(event) {
            validateMerchant(event.validationURL)
                .then(function(merchantSession) {
                    session.completeMerchantValidation(merchantSession);
                })
                .catch(function(error) {
                    console.error('Apple Pay merchant validation failed:', error);
                    session.abort();
                });
        };

        session.onpaymentauthorized = function(event) {
            processPayment(event.payment)
                .then(function(response) {
                    session.completePayment(response.success ? 
                        ApplePaySession.STATUS_SUCCESS : 
                        ApplePaySession.STATUS_FAILURE);
                    
                    if (response.success && response.redirect) {
                        window.location.href = response.redirect;
                    }
                })
                .catch(function() {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                });
        };

        session.oncancel = function() {
            console.log('Apple Pay session cancelled');
        };

        session.begin();
    }

    // Validate merchant with server
    function validateMerchant(validationURL) {
        return $.ajax({
            url: wc_apple_pay_params.ajax_url,
            type: 'POST',
            data: {
                action: 'wc_apple_pay_gateway',
                security: wc_apple_pay_params.nonce,
                action_type: 'validate_merchant',
                validation_url: validationURL
            },
            dataType: 'json'
        }).then(function(response) {
            if (!response.success) {
                throw new Error(response.data);
            }
            return response.data;
        });
    }

    // Process payment with server
    function processPayment(payment) {
        const orderData = wc_apple_pay_params.is_checkout ? 
            getCheckoutOrderData() : 
            getProductOrderData();
        
        return $.ajax({
            url: wc_apple_pay_params.ajax_url,
            type: 'POST',
            data: {
                action: 'wc_apple_pay_gateway',
                security: wc_apple_pay_params.nonce,
                action_type: 'process_payment',
                payment_data: JSON.stringify(payment),
                order_data: orderData
            },
            dataType: 'json'
        });
    }

    // Helper functions
    function getCheckoutTotal() {
        return parseFloat($('.order-total .amount').text().replace(/[^\d.]/g, ''));
    }

    function getProductPrice() {
        return parseFloat($('.product .price').text().replace(/[^\d.]/g, ''));
    }

    function getCheckoutOrderData() {
        // Get checkout form data
        return $('form.checkout').serialize();
    }

    function getProductOrderData() {
        // Get product page data (for single product purchases)
        return {
            product_id: $('input[name="add-to-cart"]').val(),
            quantity: $('input[name="quantity"]').val() || 1
        };
    }

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Wait for WooCommerce to initialize
        if (typeof wc_apple_pay_params !== 'undefined') {
            initApplePay();
        } else {
            $(document.body).on('updated_checkout', initApplePay);
        }

         initApplePay();
    });
});