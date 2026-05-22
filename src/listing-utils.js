const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatListingPrice(value) {
  const amount = Number(value || 0);
  return PRICE_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
}

export function getListingFeeForDuration(durationMonths = 1) {
  const months = Math.min(3, Math.max(1, parseInt(durationMonths, 10) || 1));
  return 0.50 + ((months - 1) * 0.50);
}

export function getDurationLabel(durationMonths = 1) {
  const months = Math.min(3, Math.max(1, parseInt(durationMonths, 10) || 1));
  return `${months} month${months === 1 ? '' : 's'}`;
}

export function getListingExpiryInfo(validUntilValue, now = Date.now()) {
  if (!validUntilValue) {
    return {
      hasExpiry: false,
      isExpired: false,
      expiresAt: null,
      remainingMs: null,
      shortLabel: '',
      status: 'none'
    };
  }

  const expiresAt = new Date(validUntilValue);
  const timestamp = expiresAt.getTime();
  if (!Number.isFinite(timestamp)) {
    return {
      hasExpiry: false,
      isExpired: false,
      expiresAt: null,
      remainingMs: null,
      shortLabel: '',
      status: 'none'
    };
  }

  const remainingMs = timestamp - now;
  const isExpired = remainingMs <= 0;

  if (isExpired) {
    return {
      hasExpiry: true,
      isExpired: true,
      expiresAt,
      remainingMs,
      shortLabel: 'Expired',
      status: 'expired'
    };
  }

  const totalHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const totalMinutes = Math.floor(remainingMs / (1000 * 60));

  let shortLabel = '';
  if (totalDays > 0) {
    shortLabel = `${totalDays}d ${hours}h`;
  } else if (totalHours > 0) {
    shortLabel = `${totalHours}h`;
  } else {
    shortLabel = `${Math.max(1, totalMinutes)}m`;
  }

  return {
    hasExpiry: true,
    isExpired: false,
    expiresAt,
    remainingMs,
    shortLabel,
    status: totalDays === 0 ? 'ending_soon' : 'active'
  };
}

export function isListingExpired(product, now = Date.now()) {
  if (!product?.valid_until) return false;
  return getListingExpiryInfo(product.valid_until, now).isExpired;
}
