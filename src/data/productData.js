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
  // Munkaruházat alkategóriák (a Depiend teljes fája szerint)
  { id: 'nadragok', categoryId: 'munkaruha', name: 'Munkanadrágok', slug: 'nadragok' },
  { id: 'felsok', categoryId: 'munkaruha', name: 'Pólók, ingek & blúzok', slug: 'felsok' },
  { id: 'puloverek', categoryId: 'munkaruha', name: 'Pulóverek', slug: 'puloverek' },
  { id: 'kabatok', categoryId: 'munkaruha', name: 'Kabátok & Dzsekik', slug: 'kabatok' },
  { id: 'lathatosagi', categoryId: 'munkaruha', name: 'Jól láthatósági ruházat', slug: 'lathatosagi' },
  { id: 'overalok', categoryId: 'munkaruha', name: 'Overálok', slug: 'overalok' },
  { id: 'langallo', categoryId: 'munkaruha', name: 'Lángálló munkaruha', slug: 'langallo' },
  { id: 'esd-ruhazat', categoryId: 'munkaruha', name: 'ESD munkaruha', slug: 'esd-ruhazat' },
  { id: 'eso-elleni', categoryId: 'munkaruha', name: 'Eső elleni ruházat', slug: 'eso-elleni' },
  { id: 'hutohazi', categoryId: 'munkaruha', name: 'Hűtőházi munkaruha', slug: 'hutohazi' },
  { id: 'ipari-vedoruha', categoryId: 'munkaruha', name: 'Ipari védőruha', slug: 'ipari-vedoruha' },
  { id: 'kopeny-tunika', categoryId: 'munkaruha', name: 'Köpenyek & Tunikák', slug: 'kopeny-tunika' },
  { id: 'elelmiszeripari', categoryId: 'munkaruha', name: 'Élelmiszeripari ruházat', slug: 'elelmiszeripari' },
  { id: 'egyszer-hasznalatos', categoryId: 'munkaruha', name: 'Egyszer használatos', slug: 'egyszer-hasznalatos' },
  { id: 'sef-ruhazat', categoryId: 'munkaruha', name: 'Séf munkaruházat', slug: 'sef-ruhazat' },

  // Cipők alkategóriák
  { id: 'cipo-s1', categoryId: 'munkacipo', name: 'S1 / S1P kategória', slug: 'cipo-s1' },
  { id: 'cipo-s2s3', categoryId: 'munkacipo', name: 'S2 / S3 kategória', slug: 'cipo-s2s3' },
  { id: 'szandal-papucs', categoryId: 'munkacipo', name: 'Szandálok & Papucsok', slug: 'szandal-papucs' },
  { id: 'zokni-talpbetet', categoryId: 'munkacipo', name: 'Zoknik & Talpbetétek', slug: 'zokni-talpbetet' },

  // Bakancsok alkategóriák
  { id: 'bakancs-s1p', categoryId: 'bakancs', name: 'S1P bakancsok', slug: 'bakancs-s1p' },
  { id: 'bakancs-s3', categoryId: 'bakancs', name: 'S3 bakancsok', slug: 'bakancs-s3' },
  { id: 'bakancs-teli', categoryId: 'bakancs', name: 'Téli bakancsok', slug: 'bakancs-teli' },
  { id: 'csizmak', categoryId: 'bakancs', name: 'Gumicsizmák', slug: 'csizmak' },

  // Kesztyűk alkategóriák
  { id: 'kesztyu-mechanikai', categoryId: 'kesztyu', name: 'Mechanikai védelem', slug: 'kesztyu-mechanikai' },
  { id: 'kesztyu-vagasbiztos', categoryId: 'kesztyu', name: 'Vágásbiztos', slug: 'kesztyu-vagasbiztos' },
  { id: 'kesztyu-hideg', categoryId: 'kesztyu', name: 'Hideg ellen', slug: 'kesztyu-hideg' },

  // Kiegészítők alkategóriák (a Depiend teljes fája szerint)
  { id: 'sisakok', categoryId: 'kiegeszitok', name: 'Sisakok', slug: 'sisakok' },
  { id: 'arcvedok', categoryId: 'kiegeszitok', name: 'Arcvédők', slug: 'arcvedok' },
  { id: 'sapkak', categoryId: 'kiegeszitok', name: 'Sapkák', slug: 'sapkak' },
  { id: 'szemuvegek', categoryId: 'kiegeszitok', name: 'Védőszemüvegek', slug: 'szemuvegek' },
  { id: 'gumipantos-szemuvegek', categoryId: 'kiegeszitok', name: 'Gumipántos (zárt) szemüvegek', slug: 'gumipantos-szemuvegek' },
  { id: 'mellenyek', categoryId: 'kiegeszitok', name: 'Jól láthatósági mellények', slug: 'mellenyek' },
  { id: 'fultokok', categoryId: 'kiegeszitok', name: 'Fültokok', slug: 'fultokok' },
  { id: 'fuldugok', categoryId: 'kiegeszitok', name: 'Füldugók', slug: 'fuldugok' },
  { id: 'legzesvedok', categoryId: 'kiegeszitok', name: 'Légzésvédők & Szűrők', slug: 'legzesvedok' },
  { id: 'terdvedok', categoryId: 'kiegeszitok', name: 'Térdvédők', slug: 'terdvedok' },
  { id: 'magasban-munka', categoryId: 'kiegeszitok', name: 'Magasban munkavégzés', slug: 'magasban-munka' }
];

export const products = productsJson;

// ======================== TERMÉK GALÉRIA ========================
// A termék képei. Ha colorCode meg van adva, CSAK az adott szín nézetei
// (elöl / hátul / részlet); egyébként az összes szín + extra nézet.
export const getProductImages = (product, colorCode = null) => {
  if (!product) return [];
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (colorCode) {
    const v = variants.find(x => x.code === colorCode);
    if (v) {
      const vi = Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image].filter(Boolean);
      if (vi.length > 0) return [...new Set(vi)];
    }
  }

  const imgs = [];
  variants.forEach(v => {
    if (Array.isArray(v.images) && v.images.length > 0) imgs.push(...v.images);
    else if (v.image) imgs.push(v.image);
  });
  if (Array.isArray(product.images)) imgs.push(...product.images);
  if (imgs.length === 0 && product.image) imgs.push(product.image);
  return [...new Set(imgs)];
};
