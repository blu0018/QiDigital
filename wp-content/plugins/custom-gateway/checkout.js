const settings = window.wc.wcSettings.getSetting('my_custom_gateway_data', {});
const label = window.wp.htmlEntities.decodeEntities(settings.title) || window.wp.i18n.__('My Custom Gateway', 'my-custom-gateway');
const { createElement, useState, useEffect, useRef } = window.wp.element;

const GooglePayButton = ({ onClick }) => {
    const [button, setButton] = useState(null);
    const [status, setStatus] = useState('loading');
    const buttonContainerRef = useRef(null);

    useEffect(() => {
        const initGooglePay = () => {
            const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
            paymentsClient.isReadyToPay({
                apiVersion: 2,
                apiVersionMinor: 0,
                allowedPaymentMethods: [{
                    type: 'CARD',
                    parameters: {
                        allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                        allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
                    }
                }]
            }).then(response => {
                if (response.result) {
                    const gpayButton = paymentsClient.createButton({
                        onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClick();
                        },
                        buttonType: 'buy',
                        buttonColor: 'black',
                        buttonSizeMode: 'fill'
                    });
                    setButton(gpayButton);
                    setStatus('ready');
                } else {
                    setStatus('error');
                }
            }).catch(err => {
                console.error('Google Pay readiness error:', err);
                setStatus('error');
            });
        };

        if (window.google?.payments?.api) {
            initGooglePay();
        } else {
            const script = document.createElement('script');
            script.src = 'https://pay.google.com/gp/p/js/pay.js';
            script.async = true;
            script.onload = initGooglePay;
            script.onerror = () => setStatus('error');
            document.body.appendChild(script);
        }
    }, [onClick]);

    useEffect(() => {
        if (status === 'ready' && button && buttonContainerRef.current && !buttonContainerRef.current.hasChildNodes()) {
            buttonContainerRef.current.appendChild(button);
        }
    }, [status, button]);

    if (status === 'loading') return createElement('div', {}, 'Loading Google Pay...');
    if (status === 'error') return createElement('div', {}, 'Google Pay unavailable');

    return createElement('div', { ref: buttonContainerRef, style: { minHeight: '40px' } });
};

const Content = () => {
    const handleGooglePayClick = () => {
        const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });

        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
                type: 'CARD',
                tokenizationSpecification: {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                        gateway: 'cardconnect', // or your gateway
                        gatewayMerchantId: 'your-merchant-id'
                    }
                },
                parameters: {
                    allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
                }
            }],
            merchantInfo: {
                merchantId: 'BCR2DN7TZCF4PVLR',
                merchantName: 'Qidigital'
            },
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: '23', // You can use window.wc.wcSettings.getSetting('cartTotals') here
                currencyCode: 'USD',
                countryCode: 'US'
            }
        };

        paymentsClient.loadPaymentData(paymentDataRequest)
            .then(paymentData => {
                const token = paymentData.paymentMethodData.tokenizationData.token;
                return fetch('http://localhost/QiDigital/wp-admin/admin-ajax.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        action: 'my_custom_process_google_pay',
                        token: token,
                        order_id: '12',
                        security: 'gpay_token_nonce',
                    })
                });
            })
            .then(res => res.json())
            .then(result => {
                if (result?.success) {
                    alert('Payment successful!');
                } else {
                    alert('Payment failed: ' + (result?.data || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Payment error:', error);
                alert('Google Pay failed.');
            });
    };

    return createElement('div', {}, [
        createElement('div', {}, label),
        createElement(GooglePayButton, { onClick: handleGooglePayClick }),
        createElement('div', {}, window.wp.htmlEntities.decodeEntities(settings.description || ''))
    ]);
};

// Register with WooCommerce Blocks
if (window.wc?.wcBlocksRegistry) {
    window.wc.wcBlocksRegistry.registerPaymentMethod({
        name: 'my_custom_gateway',
        label,
        ariaLabel: label,
        content: createElement(Content),
        edit: createElement(Content),
        canMakePayment: () => true,
        supports: {
            features: settings.supports || ['products']
        }
    });
}
