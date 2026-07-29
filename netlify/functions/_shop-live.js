// Központi indulás-kapcsoló a marketplace-feedekhez.
//
// Amíg a webshop nincs kész, a feedek ÜRESEN mennek ki: a Google Merchant,
// az Árukereső és az Árgép így nem tesz közzé egyetlen terméket sem, viszont
// az integráció (fiók, igazolás, ütemezett lekérés) beállítva marad.
//
// Élesítés: `netlify env:set SHOP_LIVE "true"` + deploy. Visszakapcsolás:
// az env törlése vagy "false" érték.
const isShopLive = () => String(process.env.SHOP_LIVE || '').toLowerCase() === 'true';

module.exports = { isShopLive };
