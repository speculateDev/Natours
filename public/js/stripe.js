/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourID => {
  const stripe = Stripe(
    'pk_test_51Pc7khIkn2z7frMRjuQsE284mIYk0GN5IISXBP6iJtqHpClri4IT3mB4dudEmqjOX6cqndnkLkDJq9yt5h5KMwMC00F0TlqxsX'
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourID}`
    );

    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
