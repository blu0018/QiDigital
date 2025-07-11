(function ($) {
    const environment = window.my_custom_google_pay_params?.environment || 'TEST';

    function renderGooglePayButton() { 
        const container = document.getElementById('google_pay_btn');
        if (!container) return;

        const paymentsClient = new google.payments.api.PaymentsClient({ environment });

        const button = paymentsClient.createButton({
            onClick: onGooglePaymentButtonClicked
        });

        container.innerHTML = ''; // Clear previous content
        container.appendChild(button);
    }

    function onGooglePaymentButtonClicked() {
        const params = window.my_custom_google_pay_params;

        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX']
                },
                tokenizationSpecification: {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                        gateway: 'cardconnect',
                        gatewayMerchantId: 'gatewayMerchantId'
                    }
                }
            }],
            merchantInfo: {
                merchantId: params?.merchant_id || '',
                merchantName: params?.merchant_name || ''
            },
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: '0.01',
                currencyCode: params?.currency || 'USD',
                countryCode: params?.country || 'US'
            }
        };

        const paymentsClient = new google.payments.api.PaymentsClient({ environment });
        paymentsClient.loadPaymentData(paymentDataRequest)
            .then(function (paymentData) {
                
                const token = paymentData.paymentMethodData.tokenizationData.token;
                console.log("Payment Success:", token);

                 const tokenField = document.getElementById('gpay_token');
                if (tokenField) {
                    tokenField.value = token;
                }


            })
            .catch(function (err) {
                console.error("❌ Payment Failed:", err);
            });
    }

    function maybeInitGooglePay() {
        const selectedMethod = $('input[name="payment_method"]:checked').val();
        // if (selectedMethod === 'my_custom_gateway') {
            renderGooglePayButton();
        // }
    }

    function waitForGooglePayLibrary(callback) {
        if (window.google && window.google.payments && window.google.payments.api) {
            callback();
        } else {
            setTimeout(() => waitForGooglePayLibrary(callback), 200);
        }
    }

    $(document).ready(function () {
        // Load GPay script dynamically if not already loaded
        if (!document.getElementById('gpay_script')) { 
            const script = document.createElement('script');
            script.async = true;
            script.id = 'gpay_script';
            script.src = 'https://pay.google.com/gp/p/js/pay.js';
            script.onload = () => waitForGooglePayLibrary(maybeInitGooglePay);
            document.head.appendChild(script);
        } else { 
            waitForGooglePayLibrary(maybeInitGooglePay);
        }

        // Handle WooCommerce checkout updates
        $('body').on('updated_checkout payment_method_selected', function () {
            waitForGooglePayLibrary(maybeInitGooglePay);
        });
    });
})(jQuery);

