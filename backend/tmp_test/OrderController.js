function calculateTotal(order) {
  const price = order?.item?.price ?? 0;
  const quantity = order?.quantity ?? 0;
  const tax = price * 0.08;
  return (price * quantity) + tax;
}

function formatReceipt(order) {
  const total = calculateTotal(order);
  return `Order Total: $${total.toFixed(2)}`;
}

module.exports = { calculateTotal, formatReceipt };