import React from 'react';

export const TermsPage = () => {
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Általános Szerződési Feltételek
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Bevezetés</h2>
          <p>
            A jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) szabályozza a MunkavédelmiShop weboldal 
            (a továbbiakban: Weboldal) által kínált szolgáltatások igénybevételének feltételeit.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>2. A Weboldal Operátora</h2>
          <p>
            <strong>Cégname:</strong> Trident Shield Group Kft.<br />
            <strong>Cégjegyzékszám:</strong> [Cégjegyzékszám]<br />
            <strong>Adószám:</strong> [Adószám]<br />
            <strong>Telephely:</strong> Budapest, Magyarország<br />
            <strong>E-mail:</strong> rendelések@munkavedelem.shop<br />
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
            Az áruk szállítása az ország egész területén lehetséges. A szállítási költség a rendelés 
            összértékétől függően a kosárban megjelenik. Az átlagos szállítási idő 1-3 munkanap.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>6. Fizetés</h2>
          <p>
            A fizetés a rendelés összegéről szóló e-mail-ben közölt módokon lehetséges. A fizetés lehet 
            bankkártyával, banki átutalással vagy más előre jelzett módokon.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>7. Elállási Jog</h2>
          <p>
            A fogyasztó a megrendelés teljesítésétől számított 30 napon belül jogosult az elállásra, 
            kivéve, ha a termék szabad felhasználásnak megfelelően megsérült. Az elállási szándék 
            közlésével a vásárló viseli az áru visszaküldésének költségeit.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>8. Felelősség</h2>
          <p>
            A MunkavédelmiShop nem felel az olyan károkért, amelyek az oldal használatából közvetlenül 
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
            Utolsó frissítés: 2024. január
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPage = () => {
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Adatvédelmi Nyilatkozat
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Az Adatkezelő Adatai</h2>
          <p>
            <strong>Szervezet neve:</strong> Trident Shield Group Kft. (MunkavédelmiShop)<br />
            <strong>Felelős adatkezelő:</strong> Demeter Márk<br />
            <strong>E-mail:</strong> adatvedelem@munkavedelem.shop
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
            <strong>E-mail:</strong> adatvedelem@munkavedelem.shop<br />
            <strong>Telefon:</strong> +36 30 272 2571
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2024. január
          </p>
        </div>
      </div>
    </div>
  );
};

export const ImpressumPage = () => {
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
            <strong>Rövidítés:</strong> MunkavédelmiShop<br />
            <strong>Cégjegyzékszám:</strong> [Cégjegyzékszám]<br />
            <strong>Adószám:</strong> [Adószám]<br />
            <strong>EU adószám:</strong> [EU adószám]<br />
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Irodai Elérhetőség</h2>
          <p>
            <strong>Cím:</strong> Budapest, Magyarország<br />
            <strong>Telefon:</strong> +36 30 272 2571<br />
            <strong>E-mail:</strong> rendelések@munkavedelem.shop<br />
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Ügyvezető</h2>
          <p>
            <strong>Név:</strong> Demeter Márk<br />
            <strong>Munkavédelmi Technikus Engedély:</strong> [Engedély száma]
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Weboldal Adatai</h2>
          <p>
            <strong>Domain:</strong> munkavedelem.shop<br />
            <strong>Hosting:</strong> Netlify<br />
            <strong>Szerkesztő:</strong> MunkavédelmiShop Team
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Felügyeleti Hatóság</h2>
          <p>
            <strong>Felelős felügyeleti hatóság (munkavédelem):</strong> Országos Munkaügyi Felügyeleti és Munkaerőpiaci Hivatal<br />
            <strong>Felelős felügyeleti hatóság (adatvédelem):</strong> Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>Felelősség Korlátozása</h2>
          <p>
            A MunkavédelmiShop nem felel az olyan technikai hibákért, amelyek a weboldal elérhetőségét 
            akadályozzák, valamint nem felel az internetes kapcsolat biztonságáért sem. Az oldalon kínált 
            termékinformációk a hatályos jogszabályok alapján wurden összeállítva, azonban a 
            jogszabályok módosulhatnak.
          </p>

          <p style={{ marginTop: '2rem', fontStyle: 'italic', color: '#666' }}>
            Utolsó frissítés: 2024. január
          </p>
        </div>
      </div>
    </div>
  );
};

export const ShippingPage = () => {
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Szállítási Feltételek
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', lineHeight: '1.8', color: '#333' }}>
          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>1. Szállítási Területek</h2>
          <p>
            A MunkavédelmiShop az egész Magyarország területén szállít. Jelenleg nemzetközi szállítás nem 
            elérhető, de felkereshetjük lehetőségeit.
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>2. Szállítási Költség</h2>
          <p>
            <strong>Szállítási díj:</strong> 1.990 Ft (állandó díj az egész ország területén)<br />
            <strong>Ingyenes szállítás:</strong> 50.000 Ft feletti rendelés esetén
          </p>

          <h2 style={{ color: '#0F2A1D', marginTop: '2rem', marginBottom: '1rem' }}>3. Szállítási Idő</h2>
          <p>
            <strong>Normál szállítás:</strong> 1-3 munkanap (hétfő-péntek)<br />
            <strong>Sürgős szállítás:</strong> 1 munkanap (előrendelés szükséges)<br />
            Az időpontok a megrendelés időpontjától számítódnak. Hétvégi és ünnepnapi megrendelések 
            következő munkanapra kezdenek el szállítódni.
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
            Utolsó frissítés: 2024. január
          </p>
        </div>
      </div>
    </div>
  );
};

export const ContactPage = () => {
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
            <p style={{ fontSize: '1.1rem' }}>
              <a href="mailto:rendelések@munkavedelem.shop" style={{ color: '#C9A961', textDecoration: 'none' }}>
                rendelések@munkavedelem.shop
              </a>
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Válaszidő: 24 óra
            </p>
          </div>

          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px' }}>
            <h3 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>📍 Cím</h3>
            <p style={{ color: '#333' }}>
              Budapest<br />
              Magyarország
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              Országos szállítás
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1.5rem' }}>Üzenet Küldése</h2>
          <form style={{
            display: 'grid',
            gap: '1rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                Név *
              </label>
              <input
                type="text"
                placeholder="Teljes neved"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                E-mail *
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                Tárgy *
              </label>
              <input
                type="text"
                placeholder="Üzenet tárgya"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#0F2A1D' }}>
                Üzenet *
              </label>
              <textarea
                placeholder="Írd ide az üzeneted..."
                rows="6"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              ></textarea>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#0F2A1D',
                color: 'white',
                padding: '1rem',
                borderRadius: '4px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Üzenet Küldése
            </button>
          </form>
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
  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ color: '#0F2A1D', marginBottom: '2rem', fontSize: '2.5rem', fontFamily: 'Georgia, serif' }}>
          Rólunk
        </h1>

        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem', lineHeight: '1.8' }}>
          <h2 style={{ color: '#0F2A1D', marginBottom: '1rem' }}>Ki vagyunk?</h2>
          <p>
            A MunkavédelmiShop a Trident Shield Group Kft. munkavédelmi e-commerce osztálya, amely 
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
                👨‍💼
              </div>
              <h4 style={{ color: '#0F2A1D' }}>Demeter Márk</h4>
              <p style={{ color: '#C9A961', fontWeight: 'bold' }}>Ügyvezető Igazgató</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                Munkavédelmi és tűzvédelmi technikus, 20+ év tapasztalat
              </p>
            </div>

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
            Hiszünk abban, hogy a munkavédelem nem luxus, hanem kötelezettség. A MunkavédelmiShop-on 
            keresztül mindent megtehetünk annak érdekében, hogy a munkavédelmi termékek könnyen elérhetőek 
            és megfizethetőek legyenek.
          </p>
        </div>
      </div>
    </div>
  );
};
