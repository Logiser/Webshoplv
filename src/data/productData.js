// MunkavédelmiShop - Termékek katalógusa
// Forrás: Depiend.hu beszállítói katalógus (Portwest), 2026.07
// Képek: /public/images/products/{cikkszam}_{szinkod}.webp (Depiend termékfotók)
// Árak: beszállítói ár + árrés, kerekítve

export const productCategories = [
  {
    id: 'munkaruha',
    name: 'Munkaruházat',
    brand: 'Portwest',
    slug: 'munkaruha',
    description: 'Strapabíró munkanadrágok, kabátok, hi-vis ruházat',
    icon: '👕'
  },
  {
    id: 'munkacipo',
    name: 'Munkavédelmi Cipők',
    brand: 'Portwest',
    slug: 'munkavedelmi-cipok',
    description: 'EN ISO 20345 szabványnak megfelelő biztonsági cipők',
    icon: '👞'
  },
  {
    id: 'bakancs',
    name: 'Bakancsok & Csizmák',
    brand: 'Portwest',
    slug: 'bakancsok-csizmak',
    description: 'Vízálló, hőálló ipari bakancsok',
    icon: '🥾'
  },
  {
    id: 'kesztyu',
    name: 'Munkavédelmi Kesztyűk',
    brand: 'Portwest',
    slug: 'munkavedelmi-kesztyuk',
    description: 'Különféle védelmi szintű munkakesztyűk',
    icon: '🧤'
  },
  {
    id: 'kiegeszitok',
    name: 'Kiegészítők & Védőfelszerelés',
    brand: 'Portwest',
    slug: 'kiegeszitok',
    description: 'Sisakok, szemüvegek, mellények, sapkák',
    icon: '🪖'
  }
];

export const productSubcategories = [
  // Munkaruházat alkategóriák
  { id: 'nadragok', categoryId: 'munkaruha', name: 'Munkanadrágok', slug: 'nadragok' },
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

  // Kesztyűk alkategóriák
  { id: 'kesztyu-mechanikai', categoryId: 'kesztyu', name: 'Mechanikai védelem', slug: 'kesztyu-mechanikai' },
  { id: 'kesztyu-hideg', categoryId: 'kesztyu', name: 'Hideg ellen', slug: 'kesztyu-hideg' },

  // Kiegészítők alkategóriák
  { id: 'sisakok', categoryId: 'kiegeszitok', name: 'Sisakok', slug: 'sisakok' },
  { id: 'szemuvegek', categoryId: 'kiegeszitok', name: 'Védőszemüvegek', slug: 'szemuvegek' },
  { id: 'mellenyek', categoryId: 'kiegeszitok', name: 'Jól láthatósági mellények', slug: 'mellenyek' },
  { id: 'sapkak', categoryId: 'kiegeszitok', name: 'Sapkák', slug: 'sapkak' }
];

export const products = [
  // ========== MUNKARUHÁZAT (7 db) ==========
  {
    id: 1,
    categoryId: 'munkaruha',
    subcategoryId: 'nadragok',
    name: 'Portwest C701 Combat munkanadrág',
    brand: 'Portwest',
    articleNo: 'C701',
    price: 10680,
    image: '/images/products/c701_bk.webp',
    description: 'Klasszikus és egyben modern munkanadrág. Strapabíró és tartós Kingsmill (65% poliészter / 35% pamut) szövetből készül, amely nagy teljesítményt és maximális viselési kényelmet biztosít. 6 darab többfunkciós, praktikus, tépőzáras tárolózsebbel van ellátva, minden fontos helyen megerősített. Az UV sugárzás 96%-át blokkolja (50+ UPF).',
    stock: 140,
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/c701_bk.webp', stock: 50 },
      { code: 'NA', color: 'Tengerészkék', image: '/images/products/c701_na.webp', stock: 40 },
      { code: 'GR', color: 'Szürke', image: '/images/products/c701_gr.webp', stock: 30 },
      { code: 'FGR', color: 'Erdőzöld', image: '/images/products/c701_fgr.webp', stock: 20 }
    ]
  },
  {
    id: 2,
    categoryId: 'munkaruha',
    subcategoryId: 'nadragok',
    name: 'Portwest C720 Tradesman lengőzsebes nadrág',
    brand: 'Portwest',
    articleNo: 'C720',
    price: 8090,
    image: '/images/products/c720_bk.webp',
    description: 'Kiváló ár-érték arányú lengőzsebes nadrág, mely bármely szakmában megállja a helyét. Sokoldalú tároló- és térdpárna zsebek, fényvisszaverő díszítés, modern színvilág. Minden fontos helyen megerősített, tartós poliészter/pamut szövet.',
    stock: 80,
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/c720_bk.webp', stock: 45 },
      { code: 'GG', color: 'Grafitszürke', image: '/images/products/c720_gg.webp', stock: 35 }
    ]
  },
  {
    id: 3,
    categoryId: 'munkaruha',
    subcategoryId: 'kabatok',
    name: 'Portwest CD110 WX1 kéttónusú dzseki',
    brand: 'Portwest',
    articleNo: 'CD110',
    price: 15260,
    image: '/images/products/cd110_by.webp',
    description: '100% pamut dzseki 6 sokoldalú tárolózsebbel: rejtett nyomógombos mellzseb, cipzáras mellzseb, 2 cipzáras oldalzseb. Szellőző hátsó rész, rejtett patentos elülső rész, kéttónusú dizájn, fényvisszaverő szegély, tépőzáras állítható mandzsetta.',
    stock: 75,
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    variants: [
      { code: 'BY', color: 'Fekete/szürke', image: '/images/products/cd110_by.webp', stock: 30 },
      { code: 'KY', color: 'Fekete/sárga', image: '/images/products/cd110_ky.webp', stock: 25 },
      { code: 'NR', color: 'Tengerészkék/royal', image: '/images/products/cd110_nr.webp', stock: 20 }
    ]
  },
  {
    id: 4,
    categoryId: 'munkaruha',
    subcategoryId: 'kabatok',
    name: 'Portwest CD871 WX2 Eco polár dzseki',
    brand: 'Portwest',
    articleNo: 'CD871',
    price: 16740,
    image: '/images/products/cd871_bk.webp',
    description: 'Környezettudatos, tanúsítottan újrahasznosított anyagból készült polár dzseki. Bolyhosodásmentes, strapabíró polár anyag, cipzáras mellzseb, 2 cipzáras oldalzseb és belső zsebek a biztonságos tárolásért. Újrahasznosított műanyag palackok felhasználásával készült.',
    stock: 90,
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/cd871_bk.webp', stock: 40 },
      { code: 'NV', color: 'Sötét tengerészkék', image: '/images/products/cd871_nv.webp', stock: 30 },
      { code: 'MG', color: 'Metálszürke', image: '/images/products/cd871_mg.webp', stock: 20 }
    ]
  },
  {
    id: 5,
    categoryId: 'munkaruha',
    subcategoryId: 'kabatok',
    name: 'Portwest CD864 WX2 Eco télikabát',
    brand: 'Portwest',
    articleNo: 'CD864',
    price: 33360,
    image: '/images/products/cd864_bk.webp',
    description: 'Vízálló ragasztott varratokkal és PFAS-mentes Texpel Splash Eco kikészítéssel készült, teljesen bélelt és párnázott télikabát. Rejtett húzózsinóros kapucni, tépőzáras állítható mandzsetta, dupla viharlebeny, 8 praktikus tárolózseb. Újrahasznosított poliészter felhasználásával.',
    stock: 55,
    rating: 4.9,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/cd864_bk.webp', stock: 25 },
      { code: 'NV', color: 'Sötét tengerészkék', image: '/images/products/cd864_nv.webp', stock: 18 },
      { code: 'MG', color: 'Metálszürke', image: '/images/products/cd864_mg.webp', stock: 12 }
    ]
  },
  {
    id: 6,
    categoryId: 'munkaruha',
    subcategoryId: 'lathatosagi',
    name: 'Portwest B303 jól láthatósági pulóver',
    brand: 'Portwest',
    articleNo: 'B303',
    price: 16020,
    image: '/images/products/b303_ye.webp',
    description: 'Ideális viselet, ha pólóhoz hűvös, de kabáthoz nem elég hideg az időjárás. Puha tapintású, kényelmes szabással. EN ISO 20471 jól láthatósági szabvány, sárga, narancs (vasúti GO/RT 3279 szabvány szerint) és piros színben.',
    stock: 95,
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    variants: [
      { code: 'YE', color: 'Sárga', image: '/images/products/b303_ye.webp', stock: 45 },
      { code: 'OR', color: 'Narancs', image: '/images/products/b303_or.webp', stock: 35 },
      { code: 'RE', color: 'Piros', image: '/images/products/b303_re.webp', stock: 15 }
    ]
  },
  {
    id: 7,
    categoryId: 'munkaruha',
    subcategoryId: 'overalok',
    name: 'Portwest 2802 munkavédelmi overál',
    brand: 'Portwest',
    articleNo: '2802',
    price: 15000,
    image: '/images/products/2802_na.webp',
    description: 'Klasszikus overál mellzsebbel és két oldalzsebbel — divatos, praktikus és strapabíró. 40+ UPF minősítésű alapanyaga az UV sugárzás 98%-át blokkolja. Rejtett patentos záródás, félig gumírozott derék, vonalzótartó zseb, összesen 4 praktikus tárolózseb, minden fontos helyen megerősítve.',
    stock: 70,
    rating: 4.6,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    variants: [
      { code: 'NA', color: 'Tengerészkék', image: '/images/products/2802_na.webp', stock: 35 },
      { code: 'NV', color: 'Sötét tengerészkék', image: '/images/products/2802_nv.webp', stock: 20 },
      { code: 'WH', color: 'Fehér', image: '/images/products/2802_wh.webp', stock: 15 }
    ]
  },

  // ========== MUNKAVÉDELMI CIPŐK (5 db) ==========
  {
    id: 8,
    categoryId: 'munkacipo',
    subcategoryId: 'cipo-s1',
    name: 'Portwest FC08 Compositelite Eco Runner S1P cipő',
    brand: 'Portwest',
    articleNo: 'FC08',
    price: 26210,
    image: '/images/products/fc08_bk.webp',
    description: 'Környezetbarát biztonsági cipő újrahasznosított PET-palackokból készült kötött felsőrésszel. Zselés talpbetét, párnázott cipőnyelv, 3D lélegző hálós bélés. Kompozit orrmerevítő és talpátszúrás elleni talplemez, 100% fémmentes, antisztatikus, SRC csúszásgátló talp, energiaelnyelő sarok.',
    stock: 85,
    rating: 4.9,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BK', color: 'Fekete/sárga', image: '/images/products/fc08_bk.webp', stock: 85 }
    ]
  },
  {
    id: 9,
    categoryId: 'munkacipo',
    subcategoryId: 'cipo-s1',
    name: 'Portwest FT16 OlymFlex London S1P cipő',
    brand: 'Portwest',
    articleNo: 'FT16',
    price: 23970,
    image: '/images/products/ft16_bb.webp',
    description: 'Sportos biztonsági cipő maximális mozgékonysággal és rugalmassággal. Phylon/gumi talp és gél talpbetét a kivételes kényelemért. Fémmentes, könnyű, flexibilis: üvegszálas kompozit orrmerevítő, fémmentes talpátszúrás elleni védelem, lélegző felsőrész, SRA csúszásmentes non-marking talp.',
    stock: 60,
    rating: 4.8,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BB', color: 'Kék/fekete', image: '/images/products/ft16_bb.webp', stock: 60 }
    ]
  },
  {
    id: 10,
    categoryId: 'munkacipo',
    subcategoryId: 'cipo-s1',
    name: 'Portwest FC64 Compositelite Trekker S1 védőcipő',
    brand: 'Portwest',
    articleNo: 'FC64',
    price: 14600,
    image: '/images/products/fc64_bk.webp',
    description: '100% fémmentes, túracipő stílusú védőlábbeli — kényelmes és nagyon könnyű. Strapabíró és rugalmas, ideális megoldás kemény munkakörülményekhez. Kompozit orrmerevítő, antisztatikus kialakítás, energiaelnyelő sarok.',
    stock: 75,
    rating: 4.6,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fc64_bk.webp', stock: 75 }
    ]
  },
  {
    id: 11,
    categoryId: 'munkacipo',
    subcategoryId: 'cipo-s2s3',
    name: 'Portwest FD61 Compositelite S2 munkavédelmi cipő',
    brand: 'Portwest',
    articleNo: 'FD61',
    price: 17020,
    image: '/images/products/fd61_bk.webp',
    description: 'Fémmentes, fűzős, mikroszálas biztonsági cipő antimikrobiális béléssel és letörölhető, vízálló felsőrésszel. Tökéletes az élelmiszeripar, a gyógyszeripar és a vendéglátás számára. Vegán barát, kompozit orrmerevítő, antisztatikus, SRC csúszásgátló talp.',
    stock: 65,
    rating: 4.7,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fd61_bk.webp', stock: 65 }
    ]
  },
  {
    id: 12,
    categoryId: 'munkacipo',
    subcategoryId: 'cipo-s2s3',
    name: 'Portwest FC19 Apex S3S ESD munkavédelmi félcipő',
    brand: 'Portwest',
    articleNo: 'FC19',
    price: 34490,
    image: '/images/products/fc19_bkb.webp',
    description: '300°C-ig hőálló külső talppal, ESD tulajdonságokkal és kiváló csúszásállósággal rendelkező prémium félcipő. A profilmintázat elősegíti a mozgékonyságot egyenetlen terepen, ellenáll olajnak és víznek. 100% fémmentes, vízálló felsőrész, kompozit orrmerevítő és talplemez.',
    stock: 50,
    rating: 4.9,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BKB', color: 'Fekete/kék', image: '/images/products/fc19_bkb.webp', stock: 28 },
      { code: 'BKY', color: 'Fekete/sárga', image: '/images/products/fc19_bky.webp', stock: 22 }
    ]
  },

  // ========== BAKANCSOK (5 db) ==========
  {
    id: 13,
    categoryId: 'bakancs',
    subcategoryId: 'bakancs-s1p',
    name: 'Portwest FC10 Compositelite S1P védőbakancs',
    brand: 'Portwest',
    articleNo: 'FC10',
    price: 19840,
    image: '/images/products/fc10_bk.webp',
    description: 'Fémmentes S1P védőbakancs kompozit orrmerevítővel és talpátszúrás elleni talplemezzel. Fekete bőr felsőrész, kétrétegű poliuretán talpszerkezet, antisztatikus kialakítás, energiaelnyelő sarok.',
    stock: 90,
    rating: 4.7,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fc10_bk.webp', stock: 90 }
    ]
  },
  {
    id: 14,
    categoryId: 'bakancs',
    subcategoryId: 'bakancs-s3',
    name: 'Portwest FC11 Compositelite Thor S3 védőbakancs',
    brand: 'Portwest',
    articleNo: 'FC11',
    price: 35000,
    image: '/images/products/fc11_bk.webp',
    description: '100% fémmentes S3 védőbakancs prémium bőr felsőrésszel és strapabíró, kétrétegű PU/TPU talppal. Kompozit orrmerevítő, talpátszúrás elleni védelem, vízálló felsőrész, antisztatikus kialakítás.',
    stock: 60,
    rating: 4.9,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fc11_bk.webp', stock: 60 }
    ]
  },
  {
    id: 15,
    categoryId: 'bakancs',
    subcategoryId: 'bakancs-s3',
    name: 'Portwest FD03 Protector Plus S3 HRO bakancs',
    brand: 'Portwest',
    articleNo: 'FD03',
    price: 22120,
    image: '/images/products/fd03_bk.webp',
    description: 'Megbízható Steelite Protector Plus bakancs 300°C-ig hőálló, robusztus talppal — ideális kihívást jelentő terepekre. Acél orrmerevítő és talpátszúrás elleni acél talplemez, vízálló teljes értékű bőr felsőrész, SRC csúszásgátló talp, párnázott bokarész.',
    stock: 70,
    rating: 4.8,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fd03_bk.webp', stock: 70 }
    ]
  },
  {
    id: 16,
    categoryId: 'bakancs',
    subcategoryId: 'bakancs-teli',
    name: 'Portwest FC12 szőrmebéléses téli védőbakancs S3 CI',
    brand: 'Portwest',
    articleNo: 'FC12',
    price: 38300,
    image: '/images/products/fc12_bk.webp',
    description: 'Hideg munkakörülményekhez tervezett, szőrmebéléses S3 CI védőbakancs fémmentes kivitelben. Hidegszigetelt talp, kompozit orrmerevítő és talplemez, vízálló felsőrész — téli kültéri munkához.',
    stock: 45,
    rating: 4.8,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/fc12_bk.webp', stock: 45 }
    ]
  },
  {
    id: 17,
    categoryId: 'bakancs',
    subcategoryId: 'bakancs-s3',
    name: 'Portwest FC17 Compositelite Montana Hiker S3 bakancs',
    brand: 'Portwest',
    articleNo: 'FC17',
    price: 45520,
    image: '/images/products/fc17_br.webp',
    description: 'Kényelmes S3 munkavédelmi bakancs orrborítással és vízlepergető nubukbőr felsőrésszel. 300°C-ig ellenálló, kétrétegű HRO talp, üvegszálas kompozit orrmerevítő, fémmentes talpátszúrás elleni védelem, SRC csúszásálló talp, energiaelnyelő sarok.',
    stock: 40,
    rating: 4.9,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
    variants: [
      { code: 'BR', color: 'Barna', image: '/images/products/fc17_br.webp', stock: 40 }
    ]
  },

  // ========== KESZTYŰK (4 db) ==========
  {
    id: 18,
    categoryId: 'kesztyu',
    subcategoryId: 'kesztyu-mechanikai',
    name: 'Portwest A100 mártott latex védőkesztyű',
    brand: 'Portwest',
    articleNo: 'A100',
    price: 760,
    image: '/images/products/a100_gn.webp',
    description: 'Prémium minőségű latex bevonatú munkakesztyű kiváló átszúrás- és kopásállósággal. Érdesített latexhab tenyérbevonat a biztos fogásért nedves és száraz körülmények között. Szellőző nyitott kézhát, varrat nélküli bélés. ANSI A1 vágásbiztonság, CE minősítés.',
    stock: 400,
    rating: 4.7,
    sizes: ['M', 'L', 'XL', '2XL'],
    variants: [
      { code: 'GN', color: 'Zöld', image: '/images/products/a100_gn.webp', stock: 120 },
      { code: 'BK', color: 'Fekete', image: '/images/products/a100_bk.webp', stock: 100 },
      { code: 'OR', color: 'Narancs', image: '/images/products/a100_or.webp', stock: 80 },
      { code: 'R8', color: 'Piros/fekete', image: '/images/products/a100_r8.webp', stock: 60 },
      { code: 'G4', color: 'Szürke/kék', image: '/images/products/a100_g4.webp', stock: 40 }
    ]
  },
  {
    id: 19,
    categoryId: 'kesztyu',
    subcategoryId: 'kesztyu-mechanikai',
    name: 'Portwest A120 PU tenyérmártott kesztyű',
    brand: 'Portwest',
    articleNo: 'A120',
    price: 270,
    image: '/images/products/a120_bk.webp',
    description: 'Precíziós munkákhoz ideális, PU tenyérmártott nylon kesztyű. Vékony, rugalmas és kopásálló bevonat, kiváló tapintásérzékenység és fogásbiztonság. EN 388 mechanikai védelem, CE minősítés. Szereléshez, csomagoláshoz, finommechanikai munkákhoz.',
    stock: 600,
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/a120_bk.webp', stock: 250 },
      { code: 'WH', color: 'Fehér', image: '/images/products/a120_wh.webp', stock: 150 },
      { code: 'GR', color: 'Szürke', image: '/images/products/a120_gr.webp', stock: 120 },
      { code: 'B4', color: 'Kék', image: '/images/products/a120_b4.webp', stock: 80 }
    ]
  },
  {
    id: 20,
    categoryId: 'kesztyu',
    subcategoryId: 'kesztyu-hideg',
    name: 'Portwest A140 téli latex védőkesztyű',
    brand: 'Portwest',
    articleNo: 'A140',
    price: 1420,
    image: '/images/products/a140_orb.webp',
    description: 'Téli kivitelű, mártott latex munkavédelmi kesztyű meleg béléssel. Az érdesített latex tenyérbevonat nedves és hideg körülmények között is biztos fogást ad. Kültéri téli munkákhoz, építőiparba, rakodáshoz.',
    stock: 250,
    rating: 4.7,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    variants: [
      { code: 'ORB', color: 'Narancs/fekete', image: '/images/products/a140_orb.webp', stock: 150 },
      { code: 'BK', color: 'Sárga/fekete', image: '/images/products/a140_bk.webp', stock: 100 }
    ]
  },
  {
    id: 21,
    categoryId: 'kesztyu',
    subcategoryId: 'kesztyu-hideg',
    name: 'Portwest A146 Arctic téli védőkesztyű',
    brand: 'Portwest',
    articleNo: 'A146',
    price: 3350,
    image: '/images/products/a146_bk.webp',
    description: 'Dupla bélésű, microfoam nitril bevonatú munkavédelmi kesztyű, amely kiválóan véd a hideg ellen. Rugalmas, homokos textúrájú nitril bevonat a biztos tapadásért nedvesen és szárazon is. 250°C kontakt hő ellen 15 mp-ig véd, OEKO-TEX® STANDARD 100 tanúsítvánnyal.',
    stock: 180,
    rating: 4.8,
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/a146_bk.webp', stock: 110 },
      { code: 'YE', color: 'Sárga', image: '/images/products/a146_ye.webp', stock: 70 }
    ]
  },

  // ========== KIEGÉSZÍTŐK (4 db) ==========
  {
    id: 22,
    categoryId: 'kiegeszitok',
    subcategoryId: 'sisakok',
    name: 'Portwest PS55 Endurance védősisak',
    brand: 'Portwest',
    articleNo: 'PS55',
    price: 7410,
    image: '/images/products/ps55_wh.webp',
    description: 'Továbbfejlesztett ABS védősisak 4 pontos állszíjjal. Szellőző sisakhéj a frissítő levegőáramlásért, 6 pontos kényelmi textil sisakkosár, racsnis gyorsbeállító. Kompatibilis a PW47, PS47, PW62, PS45 sisakra szerelhető fültokokkal. 7 év kihordási idő.',
    stock: 200,
    rating: 4.8,
    sizes: ['Egységes'],
    variants: [
      { code: 'WH', color: 'Fehér', image: '/images/products/ps55_wh.webp', stock: 60 },
      { code: 'YE', color: 'Sárga', image: '/images/products/ps55_ye.webp', stock: 50 },
      { code: 'OR', color: 'Narancs', image: '/images/products/ps55_or.webp', stock: 35 },
      { code: 'BK', color: 'Fekete', image: '/images/products/ps55_bk.webp', stock: 25 },
      { code: 'RB', color: 'Royal kék', image: '/images/products/ps55_rb.webp', stock: 20 },
      { code: 'GN', color: 'Zöld', image: '/images/products/ps55_gn.webp', stock: 10 }
    ]
  },
  {
    id: 23,
    categoryId: 'kiegeszitok',
    subcategoryId: 'szemuvegek',
    name: 'Portwest PR01 Anthracite védőszemüveg',
    brand: 'Portwest',
    articleNo: 'PR01',
    price: 2140,
    image: '/images/products/pr01_cl.webp',
    description: 'Wrap-around stílusú, könnyű védőszemüveg panorámás kilátással. Rendkívül rugalmas, kétszínű szárak, univerzális illeszkedés, puha gumírozott szárvégek. Karcolásgátló és párásodásgátló bevonat, UV védelem, 100% fémmentes, CE minősítés.',
    stock: 300,
    rating: 4.6,
    sizes: ['Egységes'],
    variants: [
      { code: 'CL', color: 'Víztiszta', image: '/images/products/pr01_cl.webp', stock: 120 },
      { code: 'SK', color: 'Füst', image: '/images/products/pr01_sk.webp', stock: 90 },
      { code: 'AM', color: 'Sárga', image: '/images/products/pr01_am.webp', stock: 60 },
      { code: 'MI', color: 'Tükröződő', image: '/images/products/pr01_mi.webp', stock: 30 }
    ]
  },
  {
    id: 24,
    categoryId: 'kiegeszitok',
    subcategoryId: 'mellenyek',
    name: 'Portwest C370 Hi-Vis MeshAir mellény',
    brand: 'Portwest',
    articleNo: 'C370',
    price: 2940,
    image: '/images/products/c370_ye.webp',
    description: 'EN ISO 20471 szabványú, jól láthatósági mellény szellőző MeshAir hálós anyagból — meleg munkakörnyezetben is kényelmes viselet. Tépőzáras záródás, fényvisszaverő csíkok. Építőipari, közúti és raktári munkákhoz.',
    stock: 350,
    rating: 4.7,
    sizes: ['S/M', 'L/XL', '2XL/3XL'],
    variants: [
      { code: 'YE', color: 'Sárga', image: '/images/products/c370_ye.webp', stock: 220 },
      { code: 'OR', color: 'Narancs', image: '/images/products/c370_or.webp', stock: 130 }
    ]
  },
  {
    id: 25,
    categoryId: 'kiegeszitok',
    subcategoryId: 'sapkak',
    name: 'Portwest B013 Insulatex kötött sapka',
    brand: 'Portwest',
    articleNo: 'B013',
    price: 2740,
    image: '/images/products/b013_bk.webp',
    description: 'Külső kötött, akril szövetű, szélálló sapka Insulatex könnyű és meleg termikus béléssel. Egyedülálló hőszigetelő rétegtechnológia, amely benntartja a test melegét. Széles színválasztékban, vállalati arculathoz igazodóan.',
    stock: 280,
    rating: 4.8,
    sizes: ['Egységes'],
    variants: [
      { code: 'BK', color: 'Fekete', image: '/images/products/b013_bk.webp', stock: 80 },
      { code: 'NV', color: 'Sötét tengerészkék', image: '/images/products/b013_nv.webp', stock: 60 },
      { code: 'GR', color: 'Szürke', image: '/images/products/b013_gr.webp', stock: 50 },
      { code: 'NA', color: 'Tengerészkék', image: '/images/products/b013_na.webp', stock: 40 },
      { code: 'YE', color: 'Sárga', image: '/images/products/b013_ye.webp', stock: 30 },
      { code: 'OR', color: 'Narancs', image: '/images/products/b013_or.webp', stock: 20 }
    ]
  }
];

// ======================== TERMÉK GALÉRIA ========================
// A termék összes képe: variáns-képek, saját images mező, vagy csak a főkép
export const getProductImages = (product) => {
  if (!product) return [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const imgs = product.variants.map(v => v.image).filter(Boolean);
    if (imgs.length > 0) return [...new Set(imgs)];
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }
  return [product.image].filter(Boolean);
};
