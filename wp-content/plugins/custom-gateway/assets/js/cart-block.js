(function () {
    const environment = window.my_custom_google_pay_params?.environment || 'TEST';

    function renderGooglePayButton(containerId = 'google_pay_cart_btn') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const paymentsClient = new google.payments.api.PaymentsClient({ environment });

        const button = paymentsClient.createButton({
            onClick: onGooglePaymentButtonClicked
        });

        container.innerHTML = ''; // Clear any previous content
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
                totalPrice: '0.01', // You can replace this with actual cart total if needed
                currencyCode: params?.currency || 'USD',
                countryCode: params?.country || 'US'
            }
        };

        const paymentsClient = new google.payments.api.PaymentsClient({ environment });

        paymentsClient.loadPaymentData(paymentDataRequest)
            .then(function (paymentData) {
                const token = paymentData.paymentMethodData.tokenizationData.token;
                console.log("🟢 Google Pay Success:", token);

                // You can send this token via AJAX or save it in a hidden input
            })
            .catch(function (err) {
                console.error("❌ Google Pay Failed:", err);
            });
    }

    function waitForGooglePayLibrary(callback) {
        if (window.google && window.google.payments && window.google.payments.api) {
            callback();
        } else {
            setTimeout(() => waitForGooglePayLibrary(callback), 200);
        }
    }

    function insertCartGPayButton() {
        const containerClass = '.wc-block-cart__payment-options'; // Or '.wc-block-cart__totals'
        const isBlockCart = document.querySelector('.wp-block-woocommerce-cart');

        if (!isBlockCart) return;

        const checkAndInsert = setInterval(() => {
            const parent = document.querySelector(containerClass);
            if (parent && !document.getElementById('google_pay_cart_btn')) {
                const gpayDiv = document.createElement('div');
                gpayDiv.id = 'google_pay_cart_btn';
                gpayDiv.style.marginTop = '15px';
                parent.appendChild(gpayDiv);

                renderGooglePayButton('google_pay_cart_btn');
                clearInterval(checkAndInsert);
            }
        }, 300);
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Load GPay script dynamically
        if (!document.getElementById('gpay_script')) {
            const script = document.createElement('script');
            script.async = true;
            script.id = 'gpay_script';
            script.src = 'https://pay.google.com/gp/p/js/pay.js';
            script.onload = () => waitForGooglePayLibrary(insertCartGPayButton);
            document.head.appendChild(script);
        } else {
            waitForGooglePayLibrary(insertCartGPayButton);
        }
    });
})();
