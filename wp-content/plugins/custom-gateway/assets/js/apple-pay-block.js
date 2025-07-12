(function ($) {
    if (typeof ApplePaySession === 'undefined') {
        return;
    }
    
    var merchant_id = "Ddd";
    var country    = "US";
    var currency    = "USD";
    var merchant_name = "dert";

    // Only run on block cart
    function isBlockCartPage() {
        return document.querySelector('.wp-block-woocommerce-cart');
    }

    function insertApplePayButton() {
        const containerClass = '.wc-block-cart__payment-options';
        const parent = document.querySelector(containerClass);
        if (!parent || document.getElementById('apple-pay-button-container')) return;

        const appleDiv = document.createElement('div');
        appleDiv.id = 'apple-pay-button-container';
        appleDiv.style.marginTop = '20px';
        appleDiv.innerHTML = `
            <button id="apple-pay-button"
                style="-webkit-appearance: -apple-pay-button;
                       -apple-pay-button-type: buy;
                       -apple-pay-button-style: black;
                       height: 40px; width: 100%;">
            </button>
        `;
        parent.appendChild(appleDiv);
        initApplePay();
    }

    function initApplePay() {
        if (!ApplePaySession.canMakePayments()) return;

        const $btn = $('#apple-pay-button');
        if ($btn.length === 0) return;

        $btn.off('click').on('click', function (e) {
            e.preventDefault();
            startApplePaySession();
        });
    }

    function startApplePaySession() {
        const cartTotal = getCartTotal();

        const paymentRequest = {
            countryCode: country,
            currencyCode: currency,
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: ['amex', 'discover', 'masterCard', 'visa'],
            total: {
                label: merchant_name,
                amount: cartTotal.toString()
            }
        };

        const session = new ApplePaySession(3, paymentRequest);

        session.onvalidatemerchant = function (event) {
            validateMerchant(event.validationURL)
                .then(function (merchantSession) {
                    session.completeMerchantValidation(merchantSession);
                })
                .catch(function (error) {
                    console.error('Apple Pay merchant validation failed:', error);
                    session.abort();
                });
        };

        session.onpaymentauthorized = function (event) {
            processPayment(event.payment)
                .then(function (response) {
                    session.completePayment(response.success ?
                        ApplePaySession.STATUS_SUCCESS :
                        ApplePaySession.STATUS_FAILURE);

                    if (response.success && response.redirect) {
                        window.location.href = response.redirect;
                    }
                })
                .catch(function () {
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                });
        };

        session.oncancel = function () {
            console.log('Apple Pay cancelled');
        };

        session.begin();
    }

    function getCartTotal() {
        const totalEl = document.querySelector('.wc-block-cart__totals-footer .wc-block-components-totals-item__value');
        return totalEl ? parseFloat(totalEl.textContent.replace(/[^\d.]/g, '')) : 0.01;
    }

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
        }).then(function (response) {
            if (!response.success) {
                throw new Error(response.data);
            }
            return response.data;
        });
    }

    function processPayment(payment) {
        return $.ajax({
            url: wc_apple_pay_params.ajax_url,
            type: 'POST',
            data: {
                action: 'wc_apple_pay_gateway',
                security: wc_apple_pay_params.nonce,
                action_type: 'process_payment',
                payment_data: JSON.stringify(payment),
                order_data: getCartOrderData()
            },
            dataType: 'json'
        });
    }

    function getCartOrderData() {
        // You can enhance this to pull more details if needed
        return {}; // Send basic data or attach cart total here if required
    }

    $(document).ready(function () {
        if (!isBlockCartPage()) return;

        // Insert button when DOM is ready
        const waitForContainer = setInterval(() => {
            if (document.querySelector('.wc-block-cart__payment-options')) {
                insertApplePayButton();
                clearInterval(waitForContainer);
            }
        }, 300);
    });
})(jQuery);
