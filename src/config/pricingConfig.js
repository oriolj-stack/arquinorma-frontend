/**
 * Pricing Configuration — Single Source of Truth
 * ================================================
 * All plan names, prices, limits and feature lists live here.
 * Import this wherever pricing data is displayed so changes
 * only need to happen in one place.
 *
 * Must stay in sync with backend SUBSCRIPTION_TIERS in:
 *   backend/app/routes/stripe_elements.py
 */

export const PRICING_TIERS = [
  {
    id: 'basic',
    name: 'Bàsic',
    price: 5.99,
    description: 'Per a projectes individuals',
    popular: false,
    features: [
      { name: 'Projectes actius',            value: '5',             included: true  },
      { name: "Preguntes a l'IA",            value: "Il·limitades",  included: true  },
      { name: 'Accés a tota la normativa',   value: true,            included: true  },
      { name: 'Suport per correu',           value: true,            included: true  },
      { name: 'Documents personalitzats',    value: null,            included: false },
      { name: 'Assistent de concursos',      value: false,           included: false },
      { name: 'Comparació de documents',     value: false,           included: false },
      { name: "Àrea privada d'estudi",       value: null,            included: false },
    ],
    cta: 'Començar amb Bàsic',
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 14.99,
    description: 'Per a professionals exigents',
    popular: true,
    features: [
      { name: 'Projectes actius',            value: "Il·limitats",   included: true  },
      { name: "Preguntes a l'IA",            value: "Il·limitades",  included: true  },
      { name: 'Accés a tota la normativa',   value: true,            included: true  },
      { name: 'Suport prioritari',           value: true,            included: true  },
      { name: 'Documents personalitzats',    value: '20/mes',        included: true  },
      { name: 'Assistent de concursos',      value: true,            included: true  },
      { name: 'Comparació de documents',     value: true,            included: true  },
      { name: "Àrea privada d'estudi",       value: null,            included: false },
    ],
    cta: 'Començar amb Pro',
  },
  {
    id: 'studio',
    name: 'Estudi',
    price: 49.00,
    description: "Per a equips i estudis d'arquitectura",
    popular: false,
    features: [
      { name: 'Projectes actius',            value: "Il·limitats",       included: true },
      { name: "Preguntes a l'IA",            value: "Il·limitades",      included: true },
      { name: 'Accés a tota la normativa',   value: true,                included: true },
      { name: 'Suport dedicat',              value: true,                included: true },
      { name: 'Documents personalitzats',    value: "Il·limitats",       included: true },
      { name: 'Gestió de concursos',         value: true,                included: true },
      { name: 'Comparació de documents',     value: true,                included: true },
      { name: "Àrea privada d'estudi",       value: true,                included: true },
      { name: "Membres d'equip",             value: '10 inclosos',       included: true },
    ],
    cta: 'Contactar vendes',
  },
];

/** Quick lookup by tier id */
export const TIER_BY_ID = Object.fromEntries(PRICING_TIERS.map(t => [t.id, t]));
