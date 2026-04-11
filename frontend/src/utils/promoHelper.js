export const calculatePromoPrice = (product, user) => {
  if (!product) return { basePrice: 0, effectivePrice: 0, isSale: false, discountPct: 0 };
  
  const basePrice = product.base_price;
  let effectivePrice = basePrice;
  let isSale = false;

  if (product.special_price) {
    const now = new Date();
    let isWithinDate = true;

    if (product.special_price_start) {
      const start = new Date(product.special_price_start);
      if (now < start) isWithinDate = false;
    }

    if (product.special_price_end) {
      const end = new Date(product.special_price_end);
      if (now > end) isWithinDate = false;
    }

    if (isWithinDate) {
      let isTargeted = false;
      const targetType = product.special_price_target || 'global';
      const targetValue = product.special_price_target_value;

      if (targetType === 'global') {
        isTargeted = true;
      } else if (user && user.email) {
        if (targetType === 'email') {
          isTargeted = user.email === targetValue;
        } else if (targetType === 'domain') {
          isTargeted = user.email.endsWith('@' + targetValue.replace(/^@/, ''));
        }
      } else if (targetType === 'role' && user && user.role) {
        isTargeted = user.role === targetValue;
      }

      if (isTargeted) {
        effectivePrice = product.special_price;
        isSale = true;
      }
    }
  }

  return {
    basePrice,
    effectivePrice,
    isSale,
    discountPct: isSale ? Math.round((1 - effectivePrice / basePrice) * 100) : 0
  };
};

export const calculateItemTotal = (product, quantity, user) => {
  if (!product) return 0;
  
  const promo = calculatePromoPrice(product, user);
  const basePrice = promo.basePrice;
  
  if (promo.isSale && product.special_price_max_qty && product.special_price_max_qty > 0 && quantity > product.special_price_max_qty) {
    const specialQty = product.special_price_max_qty;
    const normalQty = quantity - specialQty;
    return (promo.effectivePrice * specialQty) + (basePrice * normalQty);
  }
  
  return promo.effectivePrice * quantity;
};

export const calculateCartSubtotal = (cart, user) => {
  if (!cart || !Array.isArray(cart)) return 0;
  return cart.reduce((total, item) => total + calculateItemTotal(item, item.quantity, user), 0);
};
