// MunkavédelmiShop - Termékek katalógusa
// A termékadatokat a scripts/ alatti pipeline generálja a Depiend.hu beszállítói
// katalógusból (Árukereső-népszerűség alapján válogatva): products.generated.json
// Képek: /public/images/products/ - Portwest hivatalos (vízjelmentes) fotók,
// színenként több nézettel (elöl / hátul / részlet)

import productsJson from './products.generated.json';

export const productCategories = [
  {
    id: 'munkaruha',
    name: 'Munkaruházat',
    brand: 'Portwest',
    slug: 'munkaruha',
    description: 'Munkanadrágok, munkáskabátok, pólók, pulóverek, jól láthatósági ruházat és overálok — strapabíró Portwest munkaruha minden szakmához',
    icon: '👕'
  },
  {
    id: 'munkacipo',
    name: 'Munkavédelmi Cipők',
    brand: 'Portwest',
    slug: 'munkavedelmi-cipok',
    description: 'S1, S1P, S2 és S3 munkavédelmi cipők az EN ISO 20345 szabvány szerint — acél és kompozit orrmerevítős biztonsági lábbelik',
    icon: '👞'
  },
  {
    id: 'bakancs',
    name: 'Bakancsok & Csizmák',
    brand: 'Portwest',
    slug: 'bakancsok-csizmak',
    description: 'Munkavédelmi bakancsok, téli bélelt védőbakancsok és gumicsizmák — vízálló, hőálló ipari lábbelik építkezésre és üzembe',
    icon: '🥾'
  },
  {
    id: 'kesztyu',
    name: 'Munkavédelmi Kesztyűk',
    brand: 'Portwest',
    slug: 'munkavedelmi-kesztyuk',
    description: 'Latex, nitril és PU mártott munkakesztyűk, vágásbiztos és téli védőkesztyűk EN 388 minősítéssel',
    icon: '🧤'
  },
  {
    id: 'kiegeszitok',
    name: 'Kiegészítők & Védőfelszerelés',
    brand: 'Portwest',
    slug: 'kiegeszitok',
    description: 'Védősisakok, védőszemüvegek, hallásvédők, láthatósági mellények, sapkák és térdvédők — teljes egyéni védőfelszerelés',
    icon: '🪖'
  }
];

export const productSubcategories = [
  // Munkaruházat alkategóriák
  { id: 'nadragok', categoryId: 'munkaruha', name: 'Munkanadrágok', slug: 'nadragok' },
  { id: 'felsok', categoryId: 'munkaruha', name: 'Pólók & Pulóverek', slug: 'felsok' },
  { id: 'kabatok', categoryId: 'munkaruha', name: 'Kabátok & Dzsekik', slug: 'kabatok' },
  { id: 'lathatosagi', categoryId: 'munkaruha', name: 'Jól láthatósági ruházat', slug: 'lathatosagi' },
  { id: 'overalok', categoryId: 'munkaruha', name: 'Overálok', slug: 'overalok' },

  // Cipők alkategóriák
  { id: 'cipo-s1', categoryId: 'munkacipo', name: 'S1 / S1P kategória', slug: 'cipo-s1' },
  { id: 'cipo-s2s3', categoryId: 'munkacipo', name: 'S2 / S3 kategória', slug: 'cipo-s2s3' },

  // Bakancsok alkategóriák
  { id: 'bakancs-s1p', categoryId: 'bakancs', name: 'S1P bakancsok', slug: 'bakancs-s1p' },
  { id: 'bakancs-s3', categoryId: 'bakancs', name: 'S3 bakancsok', slug: 'bakancs-s3' },
  { id: 'bakancs-teli', categoryId: 'bakancs', name: 'Téli bakancsok', slug: 'bakancs-teli' },
  { id: 'csizmak', categoryId: 'bakancs', name: 'Gumicsizmák', slug: 'csizmak' },

  // Kesztyűk alkategóriák
  { id: 'kesztyu-mechanikai', categoryId: 'kesztyu', name: 'Mechanikai védelem', slug: 'kesztyu-mechanikai' },
  { id: 'kesztyu-vagasbiztos', categoryId: 'kesztyu', name: 'Vágásbiztos', slug: 'kesztyu-vagasbiztos' },
  { id: 'kesztyu-hideg', categoryId: 'kesztyu', name: 'Hideg ellen', slug: 'kesztyu-hideg' },

  // Kiegészítők alkategóriák
  { id: 'sisakok', categoryId: 'kiegeszitok', name: 'Sisakok', slug: 'sisakok' },
  { id: 'szemuvegek', categoryId: 'kiegeszitok', name: 'Védőszemüvegek', slug: 'szemuvegek' },
  { id: 'mellenyek', categoryId: 'kiegeszitok', name: 'Jól láthatósági mellények', slug: 'mellenyek' },
  { id: 'sapkak', categoryId: 'kiegeszitok', name: 'Sapkák', slug: 'sapkak' },
  { id: 'hallasvedok', categoryId: 'kiegeszitok', name: 'Hallásvédők', slug: 'hallasvedok' },
  { id: 'terdvedok', categoryId: 'kiegeszitok', name: 'Térdvédők', slug: 'terdvedok' }
];

export const products = productsJson;

// ======================== TERMÉK GALÉRIA ========================
// A termék összes képe: variáns-képek (színek) + extra nézetek (hátul/részlet)
export const getProductImages = (product) => {
  if (!product) return [];
  const imgs = [];
  if (Array.isArray(product.variants)) {
    product.variants.forEach(v => { if (v.image) imgs.push(v.image); });
  }
  if (Array.isArray(product.images)) {
    imgs.push(...product.images);
  }
  if (imgs.length === 0 && product.image) imgs.push(product.image);
  return [...new Set(imgs)];
};
