const express = require('express');

const router = express.Router();

const faqGroups = [
  {
    title: 'Orders',
    icon: 'fa-box',
    items: [
      {
        question: 'How can I track my order?',
        answer: 'Go to the Track Order page and enter your order number or tracking ID to see the latest status updates.'
      },
      {
        question: 'Can I cancel my order?',
        answer: 'If your order has not been shipped yet, please contact support as soon as possible. Cancellation is subject to order status.'
      }
    ]
  },
  {
    title: 'Payments',
    icon: 'fa-credit-card',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We support common payment options such as COD and online payments, depending on the product and checkout availability.'
      },
      {
        question: 'Why is my payment showing pending?',
        answer: 'A pending payment usually means the transaction is still being verified. If it stays pending for too long, reach out to support.'
      }
    ]
  },
  {
    title: 'Delivery',
    icon: 'fa-truck-fast',
    items: [
      {
        question: 'How long does delivery take?',
        answer: 'Delivery time depends on your location and product availability. Estimated delivery details are shown during checkout.'
      },
      {
        question: 'What if my package is delayed?',
        answer: 'If your order is delayed beyond the expected time, contact support with your order number so we can help check the status.'
      }
    ]
  },
  {
    title: 'Returns',
    icon: 'fa-rotate-left',
    items: [
      {
        question: 'How do I request a return?',
        answer: 'Please review the return policy and contact support with your order details. We will guide you through the return process.'
      },
      {
        question: 'Can all products be returned?',
        answer: 'Return eligibility depends on the product category and policy terms. Some items may not be returnable for hygiene or policy reasons.'
      }
    ]
  }
];

router.get('/', (req, res) => {
  res.render('faq/faq', {
    title: 'FAQ',
    faqGroups
  });
});

module.exports = router;
