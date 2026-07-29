// Mérettáblázatok kategóriánként.
// Forrás: Portwest hivatalos mérettáblázatok (EU méretezés).
// A termék kategóriája dönti el, melyik táblázat jelenik meg.

export const SIZE_CHARTS = {
  ruhazat: {
    title: 'Munkaruha mérettáblázat',
    intro: 'A Portwest európai (EU) méretezést használ. Mérj centiméterrel, testhez simuló ruha felett — a táblázat testméretet mutat, nem ruhaméretet.',
    columns: ['Méret', 'EU', 'Mellbőség (cm)', 'Derékbőség (cm)', 'Testmagasság (cm)'],
    rows: [
      ['XS', '44', '84–88', '68–72', '164–170'],
      ['S', '46–48', '89–96', '73–80', '170–176'],
      ['M', '50–52', '97–104', '81–88', '176–182'],
      ['L', '54–56', '105–112', '89–96', '182–188'],
      ['XL', '58–60', '113–120', '97–104', '188–194'],
      ['2XL', '62', '121–128', '105–112', '194–200'],
      ['3XL', '64', '129–136', '113–120', '194–200'],
      ['4XL', '66', '137–144', '121–128', '194–200'],
      ['5XL', '68', '145–152', '129–136', '194–200'],
      ['6XL', '70', '153–160', '137–144', '194–200']
    ],
    tips: [
      'Ha két méret között vagy, válaszd a nagyobbat — a munkaruha alá gyakran kerül pulóver vagy aláöltözet.',
      'A nadrágoknál a derékbőség a mérvadó; a szárhosszra külön „hosszított" (Tall) változat is létezik.',
      'Télikabátnál számolj a rétegezéssel: egy mérettel nagyobb a bevált választás.'
    ]
  },

  labbeli: {
    title: 'Munkavédelmi lábbeli mérettáblázat',
    intro: 'A Portwest lábbelik EU méretezésűek és mérethűek. A legpontosabb módszer: állj egy papírlapra, rajzold körbe a talpad, és mérd meg a leghosszabb pontot sarok-nagylábujj irányban.',
    columns: ['EU', 'UK', 'Talphossz (cm)'],
    rows: [
      ['36', '3', '23,0'],
      ['37', '4', '23,7'],
      ['38', '5', '24,3'],
      ['39', '6', '25,0'],
      ['40', '6,5', '25,7'],
      ['41', '7', '26,3'],
      ['42', '8', '27,0'],
      ['43', '9', '27,7'],
      ['44', '10', '28,3'],
      ['45', '11', '29,0'],
      ['46', '11,5', '29,7'],
      ['47', '12', '30,3'],
      ['48', '13', '31,0'],
      ['49', '14', '31,7'],
      ['50', '15', '32,3']
    ],
    tips: [
      'Délután mérj lábat — napközben a láb duzzad, reggel mért méret szűk lehet.',
      'Téli, vastag zoknis viselethez válassz fél–egy számmal nagyobbat.',
      'Az orrmerevítős lábbeli nem tágul: ha az orr-részben szorít, egy mérettel nagyobb kell.'
    ]
  },

  kesztyu: {
    title: 'Munkavédelmi kesztyű mérettáblázat',
    intro: 'Mérd meg a tenyered körméretét a hüvelykujj nélkül, a legszélesebb pontnál, és a középső ujjad hegyétől a csuklóig mért hosszt.',
    columns: ['Méret', 'Számozás', 'Tenyérkörméret (cm)', 'Kézhossz (cm)'],
    rows: [
      ['XS', '6', '15–16', '16,0'],
      ['S', '7', '17–18', '17,0'],
      ['M', '8', '19–20', '18,2'],
      ['L', '9', '21–22', '19,2'],
      ['XL', '10', '23–24', '20,2'],
      ['2XL', '11', '25–26', '21,2'],
      ['3XL', '12', '27–28', '22,2']
    ],
    tips: [
      'A jól illeszkedő kesztyű feszes, de nem szorít — a túl nagy kesztyű balesetveszélyes gép közelében.',
      'Vágásbiztos kesztyűnél a pontos méret különösen fontos: a laza kesztyű elcsúszik a pengén.',
      'Téli, bélelt kesztyűnél válassz egy mérettel nagyobbat.'
    ]
  },

  fejvedelem: {
    title: 'Fejméret-táblázat (sisak, sapka)',
    intro: 'Mérd meg a fejkörméretet a homlok felett kb. 2 cm-rel, a fej legszélesebb pontján.',
    columns: ['Méret', 'Fejkörméret (cm)'],
    rows: [
      ['S', '53–55'],
      ['M', '55–57'],
      ['L', '57–59'],
      ['XL', '59–61'],
      ['Állítható', '52–64']
    ],
    tips: [
      'A védősisakok többsége állítható pántos (52–64 cm), így egy méret szinte mindenkire jó.',
      'A sisak akkor ül jól, ha fejmozgatásra nem csúszik el, és a fejpánt nem nyom.'
    ]
  }
};

// Melyik táblázat tartozik egy termékhez?
export const getSizeChart = (product) => {
  if (!product) return null;
  const cat = product.categoryId;
  const sub = product.subcategoryId || '';
  const name = (product.name || '').toLowerCase();

  if (cat === 'munkacipo' || cat === 'bakancs') return SIZE_CHARTS.labbeli;
  if (cat === 'kesztyu') return SIZE_CHARTS.kesztyu;
  if (cat === 'munkaruha') return SIZE_CHARTS.ruhazat;
  if (cat === 'kiegeszitok') {
    if (sub === 'sisakok' || sub === 'sapkak' || /sisak|sapka|kámzsa|kamzsa/.test(name)) return SIZE_CHARTS.fejvedelem;
    if (sub === 'mellenyek' || /mellény|melleny|kabát|kabat|nadrág|nadrag/.test(name)) return SIZE_CHARTS.ruhazat;
    return null; // szemüveg, fültok, táska stb. — nincs értelmes mérettáblázat
  }
  return null;
};
