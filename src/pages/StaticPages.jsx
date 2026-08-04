import React, { useEffect } from 'react';

// Statikus oldalak közös SEO-effektje: cím + meta description beállítása.
// Korábban egyik statikus oldal (ÁSZF/Adatvédelem/Impresszum/Szállítás/
// Kapcsolat/Rólunk) sem állított be saját <title>-t vagy leírást — a böngésző
// fül és a keresőtalálat mindig azt mutatta, amit az előzőleg meglátogatott
// oldal hagyott ott.
const usePageMeta = (title, description) => {
  useEffect(() => {
    document.title = `${title} | TridentShop`;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [title, description]);
};

export const TermsPage = () => {
  usePageMeta('Általános Szerződési Feltételek', 'A TridentShop webshop általános szerződési feltételei: megrendelés, szállítás, fizetés, elállási jog és jogvita-rendezés.');
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Általános Szerződési Feltételek
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Bevezetés</h2>
          <p>
            A jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) szabályozza a TridentShop weboldal 
            (a továbbiakban: Weboldal) által kínált szolgáltatások igénybevételének feltételeit.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>2. A Weboldal Operátora</h2>
          <p>
            <strong>Cégnév:</strong> Trident Shield Group Kft.<br />
            <strong>Cégjegyzékszám:</strong> 15-09-093902<br />
            <strong>Adószám:</strong> 32873537-1-15<br />
            <strong>Székhely:</strong> 4485 Nagyhalász, Jókai utca 18.<br />
            <strong>Telephely (ügyfélkapcsolat):</strong> 4030 Debrecen, Keleti Ipartelep utca 4.<br />
            <strong>E-mail:</strong> iroda@tuz-munkavedelmiszaki.hu<br />
            <strong>Telefon:</strong> +36 30 272 2571
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>3. Termékek és Árak</h2>
          <p>
            A Weboldalon kínált termékek munkavédelmi ruházat és felszerelések, amelyek megfelelnek az EU és a 
            magyar jogszabályokban előírt szabványoknak. Az árak az oldalt frissítéskor érvényesek és forint-ban 
            vannak megadva.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>4. Megrendelés és Szerződéskötés</h2>
          <p>
            A megrendelés a kosárba helyezést, majd a szállítási adatok és fizetési módok megadását követő 
            "Rendelés véglegesítése" gombra kattintással kezdeményezhető. A szerződés a kifizetés sikeres 
            teljesítésével jön létre.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>5. Szállítás</h2>
          <p>
            Az áruk szállítása az ország egész területén lehetséges, futárszolgálattal házhozszállítással
            vagy Foxpost csomagautomatába. A szállítási költség a pénztárban jelenik meg
            (30 000 Ft feletti rendelésnél a szállítás ingyenes). Az átlagos szállítási idő 2-4 munkanap;
            a termékeket beszállítói raktárból indítjuk.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>6. Fizetés</h2>
          <p>
            Fizetés jelenleg utánvéttel (a csomag átvételekor) vagy banki átutalással lehetséges.
            Az átutaláshoz szükséges adatokat a rendelés-visszaigazoló e-mail tartalmazza.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>7. Elállási Jog</h2>
          <p>
            A fogyasztót a 45/2014. (II. 26.) Korm. rendelet alapján a termék átvételétől számított
            14 napon belül indokolás nélküli elállási jog illeti meg. Az elállás esetén a termék
            visszaküldésének közvetlen költségét a vásárló viseli; a vételárat (a kiszállítás alapdíjával
            együtt) a termék visszaérkezését követő 14 napon belül visszatérítjük. Az elállási jog nem
            gyakorolható higiéniai okból nem visszaváltható, felbontott csomagolású termékek esetén.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>8. Felelősség</h2>
          <p>
            A TridentShop nem felel az olyan károkért, amelyek az oldal használatából közvetlenül 
            vagy közvetetten erednek, ha ezeket az oldal üzemeltetője nem okozta. A terméken található 
            információk tájékoztató jellegűek.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>9. Szellemi Tulajdon</h2>
          <p>
            A Weboldal összes tartalma, beleértve a szövegeket, képeket és logókat, szerzői jog által 
            védett. Az oldal tartalmának felhasználása csak a tulajdonos előzetes hozzájárulásával lehetséges.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>10. Jogvita Rendezése</h2>
          <p>
            Az e dokumentumban nem szabályozott kérdéseket a magyar polgári jog rendelkezései szerint 
            kell kezelni. A jogvita rendezésére elsősorban az egyezség megkötésére irányuló tárgyalások 
            hiányában a hatáskörrel rendelkező magyar bíróság illetékes.
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2026. augusztus
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage = () => {
  usePageMeta('Adatvédelmi Nyilatkozat', 'A TridentShop adatvédelmi tájékoztatója: milyen személyes adatokat kezelünk, milyen célból, és milyen jogok illetnek meg a GDPR alapján.');
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Adatvédelmi Nyilatkozat
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Az Adatkezelő Adatai</h2>
          <p>
            <strong>Szervezet neve:</strong> Trident Shield Group Kft. (TridentShop)<br />
            <strong>Felelős adatkezelő:</strong> Németh János<br />
            <strong>E-mail:</strong> iroda@tuz-munkavedelmiszaki.hu
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>2. Az Adatkezelés Célja</h2>
          <p>
            Személyes adataid a következő céllal kezeljük:
          </p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Megrendelések feldolgozása és szállítása</li>
            <li>Ügyfélszolgáltatás nyújtása</li>
            <li>Számla- és számlázási adatok kezelése</li>
            <li>Marketing kommunikáció (hozzájárulásod esetén)</li>
            <li>Jogszabályok betartása és jogérvényesítés</li>
          </ul>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>3. Kezelt Személyes Adatok</h2>
          <p>
            Az alábbi személyes adatokat kezeljük:
          </p>
          <ul style={{ marginLeft: '2rem' }}>
            <li>Név és e-mail cím</li>
            <li>Szállítási és számlázási cím</li>
            <li>Telefonszám</li>
            <li>Megrendelés és fizetési információ</li>
            <li>IP-cím és böngészési előzmények (analytics)</li>
          </ul>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>4. Adatok Megőrzése</h2>
          <p>
            A személyes adatokat csak olyan ideig őrizzük meg, amíg szükségesek a kezelés céljára, illetve 
            a jogszabályban előírt időtartamig (pl. számlázási adatok 5 év).
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>5. Adatok Megosztása</h2>
          <p>
            Az adatokat harmadik félnek csak a szállítás, fizetés feldolgozása vagy jogszabályi kötelezettségek 
            teljesítése miatt adjuk ki. Sem marketing céllal, sem harmadik féllel nem osztjuk meg adataidat 
            hozzájárulásod nélkül.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>6. Adatbiztonság</h2>
          <p>
            Az adatok biztonságos tárolásáról gondoskodunk szokásos biztonsági intézkedésekkel. A weboldalon 
            SSL/HTTPS titkosítást használunk a szenzitív adatok védelméhez.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>7. Az Ön Jogai</h2>
          <p>
            GDPR alapján az alábbi jogok illetik meg Önt:
          </p>
          <ul style={{ marginLeft: '2rem' }}>
            <li><strong>Hozzáférési jog:</strong> Megismerheted, milyen adatokat tárolunk rólad</li>
            <li><strong>Helyesbítési jog:</strong> Kérheted az adatok helyesbítését</li>
            <li><strong>Törlési jog:</strong> Bizonyos esetekben kérheted adataid törlését</li>
            <li><strong>Korlátozási jog:</strong> Korlátozhatod az adatkezelést</li>
            <li><strong>Adathordozhatóság:</strong> Adataid átmásoltatott formában szerezheted meg</li>
          </ul>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>8. Sütik (Cookies)</h2>
          <p>
            A weboldal sütiket használ a felhasználói élmény javítása és analytics céljára. A sütiket 
            böngésződ beállításain keresztül szabályozhatod.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>9. Kapcsolat az Adatkezelővel</h2>
          <p>
            Adatkezeléssel kapcsolatos kérdéseidet az alábbi elérhetőségeken tudod feltenni:
          </p>
          <p>
            <strong>E-mail:</strong> iroda@tuz-munkavedelmiszaki.hu<br />
            <strong>Telefon:</strong> +36 30 272 2571
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2026. augusztus
          </p>
        </div>
      </div>
    </div>
  );
};

export const ImpressumPage = () => {
  usePageMeta('Impresszum', 'A TridentShop webshopot üzemeltető Trident Shield Group Kft. cégadatai, elérhetőségei és a felügyeleti hatóságok.');
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Impresszum
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>Szolgáltató Adatai</h2>
          <p>
            <strong>Cégnév:</strong> Trident Shield Group Kft.<br />
            <strong>Márkanév:</strong> TridentShop<br />
            <strong>Cégjegyzékszám:</strong> 15-09-093902<br />
            <strong>Adószám:</strong> 32873537-1-15<br />
            <strong>Székhely:</strong> 4485 Nagyhalász, Jókai utca 18.<br />
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Irodai Elérhetőség</h2>
          <p>
            <strong>Cím (telephely):</strong> 4030 Debrecen, Keleti Ipartelep utca 4.<br />
            <strong>Telefon:</strong> +36 30 272 2571<br />
            <strong>E-mail:</strong> iroda@tuz-munkavedelmiszaki.hu<br />
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Ügyvezető</h2>
          <p>
            <strong>Név:</strong> Németh János
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Weboldal Adatai</h2>
          <p>
            <strong>Domain:</strong> tridentshop.hu<br />
            <strong>Hosting:</strong> Netlify<br />
            <strong>Szerkesztő:</strong> TridentShop Team
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Felügyeleti Hatóság</h2>
          <p>
            <strong>Felelős felügyeleti hatóság (munkavédelem):</strong> Országos Munkaügyi Felügyeleti és Munkaerőpiaci Hivatal<br />
            <strong>Felelős felügyeleti hatóság (adatvédelem):</strong> Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Felelősség Korlátozása</h2>
          <p>
            A TridentShop nem felel az olyan technikai hibákért, amelyek a weboldal elérhetőségét 
            akadályozzák, valamint nem felel az internetes kapcsolat biztonságáért sem. Az oldalon kínált 
            termékinformációk a hatályos jogszabályok alapján wurden összeállítva, azonban a 
            jogszabályok módosulhatnak.
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2026. augusztus
          </p>
        </div>
      </div>
    </div>
  );
};

export const ShippingPage = () => {
  usePageMeta('Szállítási Feltételek', 'Szállítási költségek, határidők és módok a TridentShop webshopban: futárszolgálat, Foxpost csomagautomata, 30 000 Ft felett ingyenes kiszállítás.');
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Szállítási Feltételek
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Szállítási Területek</h2>
          <p>
            A TridentShop az egész Magyarország területén szállít. Jelenleg nemzetközi szállítás nem 
            elérhető, de felkereshetjük lehetőségeit.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>2. Szállítási Költség</h2>
          <p>
            <strong>Házhozszállítás futárral:</strong> 1.290 Ft (az egész ország területén)<br />
            <strong>Foxpost csomagautomata:</strong> 990 Ft<br />
            <strong>Ingyenes szállítás:</strong> 30.000 Ft feletti rendelés esetén (mindkét módnál)
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>3. Szállítási Idő</h2>
          <p>
            <strong>Házhozszállítás:</strong> 2-3 munkanap (hétfő-péntek)<br />
            <strong>Foxpost automata:</strong> 2-4 munkanap<br />
            A termékeket beszállítói raktárból indítjuk; az időpontok a megrendelés visszaigazolásától
            számítanak. Hétvégén és ünnepnapon leadott rendelés feldolgozása a következő munkanapon indul.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>4. Szállítási Mód</h2>
          <p>
            A szállítás magyar szállítmányozó cégek segítségével történik. A csomag nyomon követhető 
            szállítmány nyomonkövetési számon keresztül.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>5. Átvétel és Aláírás</h2>
          <p>
            A csomag az aláírást követően tekinthető átadottnak. A címzett felelős a csomag állapotáért 
            az átvétel pillanatában. Sérült vagy nyitott csomag esetén az átvételi igazoláson ezt jegyezd meg.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>6. Nem Kézbesített Csomagok</h2>
          <p>
            Amennyiben a szállítmányozó nem tudja kézbesíteni a csomagot, próbálkoznia fog 2-3 alkalommal. 
            Ezt követően a csomag visszaszállításra kerül. A visszaszállítási költséget a vásárló viseli.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>7. Szállítási Garancia</h2>
          <p>
            Garantáljuk, hogy az áruk az előírt minőségben érkeznek meg. Sérült termékek esetén az utolsó 
            nap (vásárlástól számított 14 nap) alatt lehetőség van az árucserére vagy teljes visszafizetésre.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>8. Vámkezelés</h2>
          <p>
            Magyarország szállítása nem igényel vámkezelést. Nemzetközi szállítás (ahol elérhető) 
            adott esetben vámköltségeket igényelhet, amelyet a vevő viseli.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>9. Biztosítás</h2>
          <p>
            Az áruk alapbiztosítás alatt szállítódnak. Értékes megrendelések esetén ajánlott a 
            különleges biztosítás igénylése, amelyre a ügyfélszolgálat tud árajánlatot adni.
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2026. augusztus
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage = () => {
  usePageMeta('Kapcsolat', 'Vedd fel velünk a kapcsolatot: telefon, email és kapcsolatfelvételi űrlap. A TridentShop ügyfélszolgálata 24 órán belül válaszol.');
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '', company: '' });
  const [status, setStatus] = React.useState(null); // null | 'sending' | 'ok' | hibaszöveg

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch('/.netlify/functions/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('ok');
        setForm({ name: '', email: '', subject: '', message: '', company: '' });
      } else {
        setStatus(data.error || 'Az üzenetet most nem tudtuk elküldeni. Kérjük, hívj minket: +36 30 272 2571');
      }
    } catch (err) {
      setStatus('Hálózati hiba. Kérjük, hívj minket: +36 30 272 2571');
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem', border: '1px solid #ddd',
    borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box'
  };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' };

  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Kapcsolatfelvétel
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>📞 Telefon</h3>
            <p style={{ fontSize: '1.2rem', color: '#C9A961', fontWeight: 'bold' }}>
              +36 30 272 2571
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Hétfő-Péntek: 9:00-17:00
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>📧 E-mail</h3>
            <p style={{ fontSize: '1.05rem' }}>
              <a href="mailto:iroda@tuz-munkavedelmiszaki.hu" style={{ color: '#C9A961', textDecoration: 'none' }}>
                iroda@tuz-munkavedelmiszaki.hu
              </a>
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Válaszidő: 24 óra
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>📍 Cím</h3>
            <p style={{ color: '#333' }}>
              4030 Debrecen,<br />
              Keleti Ipartelep utca 4.
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Országos szállítás
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1.5rem' }}>Üzenet küldése</h2>

          {status === 'ok' ? (
            <div style={{
              backgroundColor: '#e8f5e9', border: '1px solid #4CAF50', color: '#1b5e20',
              padding: '1.5rem', borderRadius: '8px'
            }}>
              <strong>Köszönjük, megkaptuk az üzeneted!</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>
                Munkatársunk 24 órán belül válaszol. Sürgős esetben hívj minket: +36 30 272 2571
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={labelStyle} htmlFor="cf-name">Név *</label>
                <input id="cf-name" type="text" required maxLength={100}
                  placeholder="Teljes neved" value={form.name} onChange={set('name')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle} htmlFor="cf-email">E-mail *</label>
                <input id="cf-email" type="email" required maxLength={120}
                  placeholder="email@example.com" value={form.email} onChange={set('email')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle} htmlFor="cf-subject">Tárgy *</label>
                <input id="cf-subject" type="text" required maxLength={150}
                  placeholder="Üzenet tárgya" value={form.subject} onChange={set('subject')} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle} htmlFor="cf-message">Üzenet *</label>
                <textarea id="cf-message" required rows="6" maxLength={4000}
                  placeholder="Írd ide az üzeneted..." value={form.message} onChange={set('message')}
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
              </div>

              {/* Spamszűrő: valódi felhasználó ezt nem látja, így nem is tölti ki */}
              <input type="text" name="company" tabIndex={-1} autoComplete="off"
                value={form.company} onChange={set('company')}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
                aria-hidden="true" />

              {status && status !== 'sending' && (
                <div style={{
                  backgroundColor: '#ffebee', border: '1px solid #d32f2f', color: '#b71c1c',
                  padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.95rem'
                }}>
                  {status}
                </div>
              )}

              <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                Az üzenet elküldésével hozzájárulsz, hogy a megadott adataidat a megkeresés
                megválaszolása céljából kezeljük. Részletek az <a href="/privacy" style={{ color: '#C9A961' }}>Adatvédelmi tájékoztatóban</a>.
              </p>

              <button type="submit" disabled={status === 'sending'} style={{
                backgroundColor: status === 'sending' ? '#6b7d73' : '#0F2A1D',
                color: 'white', padding: '1rem', borderRadius: '4px', border: 'none',
                fontSize: '1rem', fontWeight: 'bold',
                cursor: status === 'sending' ? 'default' : 'pointer', marginTop: '0.5rem'
              }}>
                {status === 'sending' ? 'Küldés…' : 'Üzenet küldése'}
              </button>
            </form>
          )}
        </div>

        <div style={{ backgroundColor: '#f0f0ec', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>ÖN előttünk</h2>
          <p style={{ color: '#333' }}>
            Munkavédelmi kérdésekkel, rendelésekkel vagy egyéb információkkal fordulj a fent felsorolt 
            elérhetőségekre. Az ügyfélszolgálat csapatunk 24 órán belül válaszol.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AboutPage = () => {
  usePageMeta('Rólunk', 'Ismerd meg a TridentShop-ot: a Trident Shield Group Kft. munkavédelmi e-commerce üzletága, amely eredeti Portwest munkaruházatot és felszerelést forgalmaz országos kiszállítással.');
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Rólunk
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', lineHeight: '1.8' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>Ki vagyunk?</h2>
          <p>
            A TridentShop a Trident Shield Group Kft. munkavédelmi e-commerce osztálya, amely 
            magas minőségű munkavédelmi ruházat és felszerelések forgalmazásában specializálódik. 
            Célunk, hogy megvédett és biztonságos munkakörnyezetet hozzunk létre vállalkozások 
            számára az egész Magyarország területén.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Történetünk</h2>
          <p>
            2022 óta segítünk kis- és középvállalkozásoknak megfelelni a munkavédelmi jogszabályoknak. 
            Kezdetben dokumentáció készítésben segítettünk, ma már teljes körűen biztosítjuk a szükséges 
            felszereléseket és felkészülést.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Misszió</h2>
          <p>
            Azt szeretnénk, hogy minden dolgozó biztonságban dolgozhasson. A megfelelő felszerelés 
            és információ könnyebb hozzáférhetővé tétele révén megelőzzük az baleseteket és egészségügyi 
            problémákat.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Értékek</h2>
          <ul style={{ marginLeft: '2rem' }}>
            <li><strong>Biztonság:</strong> A dolgozók védelme az elsődleges cél</li>
            <li><strong>Minőség:</strong> Csak az EN ISO szabványoknak megfelelő termékeket forgalmazunk</li>
            <li><strong>Professzionalizmus:</strong> Szakképzett csapat, szaktanácsadás</li>
            <li><strong>Megbízhatóság:</strong> Gyors szállítás, jó ügyfélszolgálat</li>
          </ul>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Csapatunk</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginTop: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#0F2A1D',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '3rem'
              }}>
                👩‍💼
              </div>
              <h4 style={{ color: '#0F2A1D' }}>Nagy Mária</h4>
              <p style={{ color: '#C9A961', fontWeight: 'bold' }}>Ügyfélszolgálat Vezető</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                Vendéglátóipar szakértő, 150+ ügyfél támogatása
              </p>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#f0f0ec', padding: '2rem', borderRadius: '8px' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>Szenvedélyünk</h2>
          <p style={{ color: '#333' }}>
            Hiszünk abban, hogy a munkavédelem nem luxus, hanem kötelezettség. A TridentShop-on 
            keresztül mindent megtehetünk annak érdekében, hogy a munkavédelmi termékek könnyen elérhetőek 
            és megfizethetőek legyenek.
          </p>
        </div>
      </div>
    </div>
  );
};
