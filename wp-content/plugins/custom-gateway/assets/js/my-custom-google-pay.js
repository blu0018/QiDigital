function getGooglePaymentsClient() {
      return new google.payments.api.PaymentsClient({
        environment: 'TEST',
      });
    }

    function onGooglePayLoaded() {
      const paymentsClient = getGooglePaymentsClient();
      addGooglePayButton();
    }

    function addGooglePayButton() {
      const paymentsClient = getGooglePaymentsClient();

      const buttonOptions = (google.payments.api.ButtonOptions = {
        onClick: onGooglePaymentButtonClicked,
      });

      console.log(JSON.stringify(buttonOptions, null, 2));

      const button = paymentsClient.createButton(buttonOptions);

      let container = document.getElementById('google_pay_btn');
      if (container.firstChild) {
        container.replaceChild(button, container.firstChild);
      } else {
        container.appendChild(button);
      }
    }

    function getRequest() {
      const allowedCardNetworks = [
        'AMEX',
        'DISCOVER',
        'INTERAC',
        'JCB',
        'MASTERCARD',
        'VISA',
      ];

      // also called IsReadyToPayRequest in the docs
      googlePayConfig = {
        apiVersion: 2,
        apiVersionMinor: 0,
      };
      paymentDataRequest = Object.assign({}, googlePayConfig);
      // currency code is ISO 4217 code
      // country code is ISO 3166-1 alpha-2 code for where the transaction is processed
      paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'FINAL',
        totalPrice: '0', // will change this later
        currencyCode: 'USD',
        countryCode: 'US',
      };
      paymentDataRequest.merchantInfo = {
        merchantId: 'BCR2DN7TZCF4PVLR',
        merchantName: 'Qidigital',
      };
      const tokenizationSpec = {
        type: 'PAYMENT_GATEWAY',
        parameters: {
          gateway: 'cardconnect',
          gatewayMerchantId: 'gatewayMerchantId',
        },
      };
      const cardPaymentMethod = {
        type: 'CARD',
        tokenizationSpecification: tokenizationSpec,
        parameters: {
          allowedCardNetworks: allowedCardNetworks,
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          //billingAddressParamters: {
          //    format: "FULL",
          //    phoneNumberRequired: false
          //}
        },
      };
      paymentDataRequest.shippingAddressRequired = false;
      paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
      return paymentDataRequest;
    }

    function onGooglePaymentButtonClicked() {
      const paymentDataRequest = getRequest();
      console.log(JSON.stringify(paymentDataRequest, null, 2));
      //paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

      const paymentsClient = getGooglePaymentsClient();
      paymentsClient.loadPaymentData(paymentDataRequest).then((paymentData) => {
          processPayment(paymentData);
    	}).catch((error) => {
        // errors will be displayed in the Google Pay window
        console.log(error);
        return;
    	});
    }

    function processPayment(paymentData) {
      console.log(paymentData);
    }