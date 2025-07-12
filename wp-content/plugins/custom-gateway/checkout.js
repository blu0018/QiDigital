// const settings = window.wc.wcSettings.getSetting('my_custom_gateway_data', {});
// const label = window.wp.htmlEntities.decodeEntities(settings.title) || window.wp.i18n.__('My Custom Gateway', 'my-custom-gateway');
// const { createElement, useState, useEffect, useRef } = window.wp.element;

// const GooglePayButton = ({ onClick }) => {
//     const [button, setButton] = useState(null);
//     const [status, setStatus] = useState('loading');
//     const buttonContainerRef = useRef(null);

//     useEffect(() => {
//         const initGooglePay = () => {
//             const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
//             paymentsClient.isReadyToPay({
//                 apiVersion: 2,
//                 apiVersionMinor: 0,
//                 allowedPaymentMethods: [{
//                     type: 'CARD',
//                     parameters: {
//                         allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
//                         allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
//                     }
//                 }]
//             }).then(response => {
//                 if (response.result) {
//                     const gpayButton = paymentsClient.createButton({
//                         onClick: (e) => {
//                             e.preventDefault();
//                             e.stopPropagation();
//                             onClick();
//                         },
//                         buttonType: 'buy',
//                         buttonColor: 'black',
//                         buttonSizeMode: 'fill'
//                     });
//                     setButton(gpayButton);
//                     setStatus('ready');
//                 } else {
//                     setStatus('error');
//                 }
//             }).catch(err => {
//                 console.error('Google Pay readiness error:', err);
//                 setStatus('error');
//             });
//         };

//         if (window.google?.payments?.api) {
//             initGooglePay();
//         } else {
//             const script = document.createElement('script');
//             script.src = 'https://pay.google.com/gp/p/js/pay.js';
//             script.async = true;
//             script.onload = initGooglePay;
//             script.onerror = () => setStatus('error');
//             document.body.appendChild(script);
//         }
//     }, [onClick]);

//     useEffect(() => {
//         if (status === 'ready' && button && buttonContainerRef.current && !buttonContainerRef.current.hasChildNodes()) {
//             buttonContainerRef.current.appendChild(button);
//         }
//     }, [status, button]);

//     if (status === 'loading') return createElement('div', {}, 'Loading Google Pay...');
//     if (status === 'error') return createElement('div', {}, 'Google Pay unavailable');

//     return createElement('div', { ref: buttonContainerRef, style: { minHeight: '40px' } });
// };

// const Content = () => {
//     const handleGooglePayClick = () => {
//         const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });

//         const paymentDataRequest = {
//             apiVersion: 2,
//             apiVersionMinor: 0,
//             allowedPaymentMethods: [{
//                 type: 'CARD',
//                 tokenizationSpecification: {
//                     type: 'PAYMENT_GATEWAY',
//                     parameters: {
//                         gateway: 'cardconnect', // or your gateway
//                         gatewayMerchantId: 'your-merchant-id'
//                     }
//                 },
//                 parameters: {
//                     allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
//                     allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
//                 }
//             }],
//             merchantInfo: {
//                 merchantId: 'BCR2DN7TZCF4PVLR',
//                 merchantName: 'Qidigital'
//             },
//             transactionInfo: {
//                 totalPriceStatus: 'FINAL',
//                 totalPrice: '23', // You can use window.wc.wcSettings.getSetting('cartTotals') here
//                 currencyCode: 'USD',
//                 countryCode: 'US'
//             }
//         };

//         paymentsClient.loadPaymentData(paymentDataRequest)
//             .then(paymentData => {
//                 const token = paymentData.paymentMethodData.tokenizationData.token;
//                 return fetch('http://localhost/QiDigital/wp-admin/admin-ajax.php', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//                     body: new URLSearchParams({
//                         action: 'my_custom_process_google_pay',
//                         token: token,
//                         order_id: '12',
//                         security: 'gpay_token_nonce',
//                     })
//                 });
//             })
//             .then(res => res.json())
//             .then(result => {
//                 if (result?.success) {
//                     alert('Payment successful!');
//                 } else {
//                     alert('Payment failed: ' + (result?.data || 'Unknown error'));
//                 }
//             })
//             .catch(error => {
//                 console.error('Payment error:', error);
//                 alert('Google Pay failed.');
//             });
//     };

//     return createElement('div', {}, [
//         createElement('div', {}, label),
//         createElement(GooglePayButton, { onClick: handleGooglePayClick }),
//         createElement('div', {}, window.wp.htmlEntities.decodeEntities(settings.description || ''))
//     ]);
// };

// // Register with WooCommerce Blocks
// if (window.wc?.wcBlocksRegistry) {
//     window.wc.wcBlocksRegistry.registerPaymentMethod({
//         name: 'my_custom_gateway',
//         label,
//         ariaLabel: label,
//         content: createElement(Content),
//         edit: createElement(Content),
//         canMakePayment: () => true,
//         supports: {
//             features: settings.supports || ['products']
//         }
//     });
// }


const settings = window.wc?.wcSettings?.getSetting('my_custom_apple_pay_data', {}) || {};
const label = window.wp.htmlEntities.decodeEntities(settings.title || 'Apple Pay');
const description = window.wp.htmlEntities.decodeEntities(settings.description || '');

const { createElement, useState, useEffect, useRef } = window.wp.element;
const { registerPaymentMethodExtensionCallbacks } = window.wc.wcBlocksRegistry;

const ApplePayButton = ({ onClick }) => {
    const [isAvailable, setAvailable] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (window.ApplePaySession?.canMakePayments?.()) {
            setAvailable(true);
        }
    }, []);

    useEffect(() => {
        if (!isAvailable || !ref.current) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'apple-pay-button';
        btn.style = `
            -webkit-appearance: -apple-pay-button;
            -apple-pay-button-type: buy;
            -apple-pay-button-style: black;
            height: 44px;
            width: 100%;
        `;
        btn.onclick = (e) => {
            e.preventDefault();
            onClick();
        };

        ref.current.innerHTML = '';
        ref.current.appendChild(btn);
    }, [isAvailable]);

    if (!isAvailable) return createElement('div', {}, 'Apple Pay not available');
    return createElement('div', { ref, style: { marginTop: '15px' } });
};

const ApplePayContent = () => { 
    const handleClick = () => {
        const session = new ApplePaySession(3, {
            countryCode: settings.country || 'US',
            currencyCode: settings.currency || 'USD',
            merchantCapabilities: ['supports3DS'],
            supportedNetworks: ['visa', 'masterCard', 'amex'],
            total: {
                label: settings.merchantName || 'My Store',
                amount: settings.totalPrice || '10.00'
            }
        });

        session.onvalidatemerchant = (event) => {
            fetch(settings.ajax_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'wc_apple_pay_gateway',
                    action_type: 'validate_merchant',
                    validation_url: event.validationURL,
                    security: settings.nonce
                })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    session.completeMerchantValidation(res.data);
                } else {
                    console.error('Merchant validation failed:', res);
                    session.abort();
                }
            })
            .catch(err => {
                console.error('Merchant validation error:', err);
                session.abort();
            });
        };

        session.onpaymentauthorized = (event) => {
            fetch(settings.ajax_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'wc_apple_pay_gateway',
                    action_type: 'process_payment',
                    payment_data: JSON.stringify(event.payment),
                    security: settings.nonce
                })
            })
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    session.completePayment(ApplePaySession.STATUS_SUCCESS);
                    if (res.redirect) {
                        window.location.href = res.redirect;
                    }
                } else {
                    console.error('Payment failed:', res);
                    session.completePayment(ApplePaySession.STATUS_FAILURE);
                }
            })
            .catch(err => {
                console.error('Payment error:', err);
                session.completePayment(ApplePaySession.STATUS_FAILURE);
            });
        };

        session.oncancel = () => {
            console.log('Apple Pay session cancelled.');
        };

        session.begin();
    };

    return createElement('div', {}, [
        createElement('div', {}, label),
        createElement(ApplePayButton, { onClick: handleClick }),
        createElement('div', {}, description)
    ]);
};

registerPaymentMethodExtensionCallbacks('my_custom_apple_pay', () => ({
    content: () => createElement(ApplePayContent),
    edit: () => createElement(ApplePayContent),
    canMakePayment: () => !!window.ApplePaySession?.canMakePayments?.(),
    ariaLabel: label,
    supports: {
        features: settings.supports || ['products']
    }
}));
