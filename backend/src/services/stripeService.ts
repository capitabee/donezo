import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export const stripeService = {
  async createCustomer(email: string, name: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          platform: 'donezo'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return null;
    }
  },

  async createCheckoutSession(
    customerId: string,
    tier: 'Professional' | 'Expert',
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session | null> {
    const prices = {
      Professional: 25000,
      Expert: 60000
    };

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Donezo ${tier} Upgrade`,
              description: `Upgrade to ${tier} tier - Increased salary cap and benefits`
            },
            unit_amount: prices[tier]
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tier,
          upgrade_type: 'tier_upgrade'
        }
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  },

  async createPaymentIntent(
    customerId: string,
    amount: number,
    description: string
  ): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        amount: Math.round(amount * 100),
        currency: 'gbp',
        description,
        automatic_payment_methods: {
          enabled: true
        }
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  },

  async setupMandate(customerId: string, returnUrl: string): Promise<Stripe.SetupIntent | null> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['bacs_debit'],
        usage: 'off_session',
        metadata: {
          purpose: 'salary_payout_mandate'
        }
      });
      return setupIntent;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      return null;
    }
  },

  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent | null> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          purpose: 'platform_mandate'
        }
      });
      return setupIntent;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      return null;
    }
  },

  async chargeCustomer(
    customerId: string, 
    paymentMethodId: string, 
    amountInPence: number, 
    description: string
  ): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        payment_method: paymentMethodId,
        amount: amountInPence,
        currency: 'gbp',
        off_session: true,
        confirm: true,
        description,
        metadata: {
          source: 'admin_charge'
        }
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error charging customer:', error);
      return null;
    }
  },

  async chargeMandate(customerId: string, amount: number, description: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'bacs_debit'
      });

      if (paymentMethods.data.length === 0) {
        console.error('No mandate found for customer');
        return null;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        customer: customerId,
        amount: Math.round(amount * 100),
        currency: 'gbp',
        payment_method: paymentMethods.data[0].id,
        off_session: true,
        confirm: true,
        description
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error charging mandate:', error);
      return null;
    }
  },

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) return null;
      return customer as Stripe.Customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      return null;
    }
  },

  async constructWebhookEvent(payload: string | Buffer, signature: string, endpointSecret: string): Promise<Stripe.Event | null> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return null;
    }
  },

  getPublishableKey(): string {
    return process.env.STRIPE_PUBLISHABLE_KEY || '';
  }
};

export default stripeService;
